const { PrismaClient } = require("./packages/database/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function fixOrders() {
  const orders = await prisma.posOrder.findMany({
    include: { items: { include: { menuItem: true } } }
  });
  
  let fixedCount = 0;
  for (const order of orders) {
    let subtotal = 0;
    order.items.forEach(i => {
      if (i.status !== "RETURNED" && i.status !== "RETURN_REQUESTED") {
        subtotal += Number(i.menuItem.price) * i.quantity;
      }
    });
    
    // For simplicity, we just assume tax is fully handled if the code above uses just price or if we ignore tax here.
    // Wait, the order totalAmount actually includes tax?
    // Let's recalculate accurately including tax!
    let subtotalWithTax = 0;
    
    // Oh wait, in pos.service.ts recalculateOrderTotal just uses subtotal - discountAmount without tax!
    // Wait, let's see recalculateOrderTotal:
    // const finalTotal = Math.max(0, subtotal - Number(order.discountAmount || 0));
    // It doesn't include tax in recalculateOrderTotal?!
    // Oh, the taxes were added to the menuItem.price? No, they are separate.
    // Let's just run recalculateOrderTotal logic from pos.service directly on the API? No, script is fine.
  }
}
fixOrders().then(() => console.log("done"));
