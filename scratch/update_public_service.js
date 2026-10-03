const fs = require('fs');

let content = fs.readFileSync('apps/api/src/modules/public/public.service.ts', 'utf8');

// Import the new DTO at the top
if (!content.includes('CreateMenuOrderDto')) {
  content = content.replace(
    `import { CreateBookingDto } from './dto/create-booking.dto';`,
    `import { CreateBookingDto } from './dto/create-booking.dto';\nimport { CreateMenuOrderDto } from './dto/create-menu-order.dto';`
  );
}

const newMethod = `
  async createMenuOrder(dto: CreateMenuOrderDto) {
    // 1. Find room
    const room = await this.prisma.room.findFirst({
      where: { number: dto.roomNumber }
    });

    if (!room) {
      throw new BadRequestException('Room not found');
    }

    // 2. Find active checked-in reservation for this room
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        roomId: room.id,
        status: 'CHECKED_IN'
      },
      include: {
        folio: true
      }
    });

    if (!reservation) {
      throw new BadRequestException('No active check-in found for this room. Please contact front desk.');
    }

    if (!reservation.folio) {
      throw new BadRequestException('No active folio found for this room.');
    }

    // 3. Get menu items to calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.posMenuItem.findUnique({
        where: { id: item.menuItemId }
      });
      if (!menuItem) {
        throw new BadRequestException(\`Menu item \${item.menuItemId} not found\`);
      }
      
      totalAmount += (Number(menuItem.price) * item.quantity);
      
      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
        status: 'PENDING'
      });
    }

    // 4. Create PosOrder
    const posOrder = await this.prisma.posOrder.create({
      data: {
        status: 'OPEN',
        totalAmount,
        folioId: reservation.folio.id,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true
      }
    });

    // 5. Post to Folio immediately (since it's a room service order, we can post it or keep it OPEN until fulfilled)
    // For now, we leave it OPEN. The kitchen will see it, prepare it, and once SERVED/BILLED_TO_ROOM, it can hit the folio.
    // Actually, in Yarvo OS, PosOrders hit the folio when they are finalized or billed. 

    return {
      success: true,
      orderId: posOrder.id,
      message: 'Room service order placed successfully. It is being prepared!'
    };
  }
`;

if (!content.includes('createMenuOrder(')) {
  const insertIndex = content.lastIndexOf('}');
  content = content.substring(0, insertIndex) + newMethod + '\n}\n';
  fs.writeFileSync('apps/api/src/modules/public/public.service.ts', content, 'utf8');
  console.log('Added createMenuOrder to public.service.ts');
} else {
  console.log('createMenuOrder already exists');
}
