const fs = require('fs');

let content = fs.readFileSync('apps/api/src/modules/public/public.controller.ts', 'utf8');

if (!content.includes('CreateMenuOrderDto')) {
  content = content.replace(
    `import { CreateBookingDto } from './dto/create-booking.dto';`,
    `import { CreateBookingDto } from './dto/create-booking.dto';\nimport { CreateMenuOrderDto } from './dto/create-menu-order.dto';`
  );
}

const newEndpoint = `
  @Post('menu-orders')
  @ApiOperation({ summary: 'Submit a new room service POS order from website' })
  @ApiResponse({ status: 201, description: 'Order successfully created and sent to kitchen/bar.' })
  async createMenuOrder(@Body() createMenuOrderDto: CreateMenuOrderDto) {
    return { data: await this.publicService.createMenuOrder(createMenuOrderDto) };
  }
`;

if (!content.includes("@Post('menu-orders')")) {
  const insertIndex = content.lastIndexOf('}');
  content = content.substring(0, insertIndex) + newEndpoint + '\n}\n';
  fs.writeFileSync('apps/api/src/modules/public/public.controller.ts', content, 'utf8');
  console.log('Added menu-orders endpoint to public.controller.ts');
}
