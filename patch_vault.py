import os

# Update code.gs
cg_path = r'g:\My Drive\CODEAPP\XooEnglish\backend\code.gs'
with open(cg_path, 'r', encoding='utf-8') as f:
    cg_content = f.read()

cg_content = cg_content.replace(
    'var FIREBASE_URL = "https://xooenglishapp-default-rtdb.firebaseio.com";',
    'var FIREBASE_URL = "https://xooenglishapp-default-rtdb.firebaseio.com/Xoo_Secret_Vault_2026";'
)
with open(cg_path, 'w', encoding='utf-8') as f:
    f.write(cg_content)


# Update app.js
aj_path = r'g:\My Drive\CODEAPP\XooEnglish\js\app.js'
with open(aj_path, 'r', encoding='utf-8') as f:
    aj_content = f.read()

# Replace db.ref('/') -> db.ref('/' + CONFIG.DB_VAULT)
aj_content = aj_content.replace(
    "db.ref('/').on('value'",
    "db.ref('/' + (CONFIG.DB_VAULT || '')).on('value'"
)

# Replace db.ref().update({'/Main': mainArr, '/Lich_Su_Diem_Danh': histArr});
# Because update({'/Main': ..}) updates children of the current ref, we MUST apply vault to the ref
aj_content = aj_content.replace(
    "await db.ref().update({",
    "await db.ref('/' + (CONFIG.DB_VAULT || '')).update({"
)

# Replace db.ref('/Main').set(mainArr) -> db.ref('/' + CONFIG.DB_VAULT + '/Main').set(mainArr)
aj_content = aj_content.replace(
    "await db.ref('/Main').set(mainArr)",
    "await db.ref('/' + (CONFIG.DB_VAULT || '') + '/Main').set(mainArr)"
)

with open(aj_path, 'w', encoding='utf-8') as f:
    f.write(aj_content)

print("Patch Vault Success!")
