import sys

with open("apps/web/src/app/dashboard/billing/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add </> before )}
old = """                      </form>
                    )}
                  </div>"""

new = """                      </form>
                      </>
                    )}
                  </div>"""
code = code.replace(old, new)

with open("apps/web/src/app/dashboard/billing/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
