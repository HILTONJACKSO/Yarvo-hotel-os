import re

file_path = "apps/api/src/modules/tickets/tickets.service.ts"
with open(file_path, "r") as f:
    content = f.read()

# Replace the getDailyStats function completely
old_stats_func = """  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['VALID', 'USED'] },
      }
    });

    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.price), 0);
    
    const adultsCount = tickets.filter(t => t.type.toUpperCase().includes('ADULT')).length;
    const childrenCount = tickets.filter(t => t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD')).length;
    
    return { totalOrders: totalTickets, totalRevenue, adultsCount, childrenCount };
  }"""

new_stats_func = """  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['VALID', 'USED'] },
      }
    });

    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum, t) => sum + Number(t.price), 0);
    
    // Entry Breakdown
    const entryAdults = tickets.filter(t => t.type.toUpperCase().includes('ENTRY') && t.type.toUpperCase().includes('ADULT'));
    const entryKids = tickets.filter(t => t.type.toUpperCase().includes('ENTRY') && (t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD')));
    
    // Pool Breakdown
    const poolAdults = tickets.filter(t => t.type.toUpperCase().includes('POOL') && t.type.toUpperCase().includes('ADULT'));
    const poolKids = tickets.filter(t => t.type.toUpperCase().includes('POOL') && (t.type.toUpperCase().includes('KID') || t.type.toUpperCase().includes('CHILD')));
    
    const breakdown = {
      entryAdults: { count: entryAdults.length, revenue: entryAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      entryKids: { count: entryKids.length, revenue: entryKids.reduce((sum, t) => sum + Number(t.price), 0) },
      poolAdults: { count: poolAdults.length, revenue: poolAdults.reduce((sum, t) => sum + Number(t.price), 0) },
      poolKids: { count: poolKids.length, revenue: poolKids.reduce((sum, t) => sum + Number(t.price), 0) }
    };
    
    return { totalOrders: totalTickets, totalRevenue, breakdown };
  }"""

content = content.replace(old_stats_func, new_stats_func)

with open(file_path, "w") as f:
    f.write(content)

print("Fixed getDailyStats in tickets.service.ts")
