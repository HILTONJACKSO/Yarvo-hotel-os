import sys

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix the JSX fragment issue
old_conditional = "{ (isCashierOrManager || isFrontDesk) && ("
new_conditional = "{ (isCashierOrManager || isFrontDesk) && (\n                      <>"
code = code.replace(old_conditional, new_conditional)

old_form_end = """                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20">Add Payment</button>
                      </form>
                    )}"""
new_form_end = """                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-emerald-900/20">Add Payment</button>
                      </form>
                      </>
                    )}"""
code = code.replace(old_form_end, new_form_end)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
