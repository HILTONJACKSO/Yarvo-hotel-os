import re

file_path = "apps/web/src/app/dashboard/tickets/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the stats block
old_stats_block = re.search(r'      \{\/\* Overall Stats \*\/\}.*?      </div>\n      </div>', content, re.DOTALL)

if old_stats_block:
    new_stats_block = """      {/* Unified Stats Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 shrink-0">
        
        {/* Total Stats */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-center transition-all hover:bg-slate-800">
            <h3 className="text-slate-400 text-xs font-medium mb-1">Tickets Sold Today</h3>
            <p className="text-white text-2xl font-bold">{stats?.totalOrders || 0}</p>
          </div>
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-center transition-all hover:bg-slate-800">
            <h3 className="text-slate-400 text-xs font-medium mb-1">Revenue Generated</h3>
            <p className="text-cyan-400 text-2xl font-bold">${(stats?.totalRevenue || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Entry Breakdown */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between transition-all hover:bg-slate-800">
          <h3 className="text-slate-300 text-xs font-bold border-b border-slate-700/50 pb-2 mb-2">Entry Passes</h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-xs">Adults <span className="text-slate-300">({stats?.breakdown?.entryAdults?.count || 0})</span></span>
            <span className="text-emerald-400 text-sm font-medium">${(stats?.breakdown?.entryAdults?.revenue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Kids <span className="text-slate-300">({stats?.breakdown?.entryKids?.count || 0})</span></span>
            <span className="text-emerald-400 text-sm font-medium">${(stats?.breakdown?.entryKids?.revenue || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Pool Breakdown */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between transition-all hover:bg-slate-800">
          <h3 className="text-slate-300 text-xs font-bold border-b border-slate-700/50 pb-2 mb-2">Pool Passes</h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-slate-400 text-xs">Adults <span className="text-slate-300">({stats?.breakdown?.poolAdults?.count || 0})</span></span>
            <span className="text-emerald-400 text-sm font-medium">${(stats?.breakdown?.poolAdults?.revenue || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-xs">Kids <span className="text-slate-300">({stats?.breakdown?.poolKids?.count || 0})</span></span>
            <span className="text-emerald-400 text-sm font-medium">${(stats?.breakdown?.poolKids?.revenue || 0).toFixed(2)}</span>
          </div>
        </div>

      </div>"""
    
    content = content[:old_stats_block.start()] + new_stats_block + content[old_stats_block.end():]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced layout successfully")
else:
    print("Could not find the stats block")
