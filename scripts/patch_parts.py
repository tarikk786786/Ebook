path = r"C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks\lib\catalog.ts"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = """function getMaster86kList(): any[] {
  if (cachedMasterIndex) return cachedMasterIndex;
  try {
    if (typeof window === "undefined") {
      const fs = eval("require('fs')");
      const path = eval("require('path')");
      const masterPath = path.resolve(process.cwd(), "data", "catalog", "master_86k_index.json");
      if (fs.existsSync(masterPath)) {
        cachedMasterIndex = JSON.parse(fs.readFileSync(masterPath, "utf8"));
        return cachedMasterIndex || [];
      }
    }
  } catch {}
  return [];
}"""

replacement = """function getMaster86kList(): any[] {
  if (cachedMasterIndex) return cachedMasterIndex;
  try {
    if (typeof window === "undefined") {
      const fs = eval("require('fs')");
      const path = eval("require('path')");
      const p1Path = path.resolve(process.cwd(), "data", "catalog", "master_86k_part1.json");
      const p2Path = path.resolve(process.cwd(), "data", "catalog", "master_86k_part2.json");
      if (fs.existsSync(p1Path) && fs.existsSync(p2Path)) {
        const p1 = JSON.parse(fs.readFileSync(p1Path, "utf8"));
        const p2 = JSON.parse(fs.readFileSync(p2Path, "utf8"));
        cachedMasterIndex = p1.concat(p2);
        return cachedMasterIndex || [];
      }
      const masterPath = path.resolve(process.cwd(), "data", "catalog", "master_86k_index.json");
      if (fs.existsSync(masterPath)) {
        cachedMasterIndex = JSON.parse(fs.readFileSync(masterPath, "utf8"));
        return cachedMasterIndex || [];
      }
    }
  } catch {}
  return [];
}"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("REPLACED SUCCESSFULLY")
else:
    print("TARGET NOT FOUND")
