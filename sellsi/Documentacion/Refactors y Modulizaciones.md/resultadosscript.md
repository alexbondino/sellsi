# Cycle Detector Report

**Summary**

- Files scanned: 530
- Edges: 1004
- Cycles: 91
- Max cycle length considered: 10
- Duration: 2488 ms

## Cycles (91)

### Cycle 1 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx
- sellsi\src\domains\admin\index.js
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 53)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\pages\AdminPanelHome.jsx (type: export { ... } from | spec: ./pages/AdminPanelHome | line: 11)
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (type: import | spec: ../components/AdminAccountCreator | line: 38)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\pages\AdminPanelHome.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (score=0, reason=import)

---

### Cycle 2 (size=4)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx
- sellsi\src\domains\admin\components\AdminAccountManager.jsx
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\pages\AdminPanelHome.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx -> sellsi\src\domains\admin\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (type: export { ... } from | spec: ./components/AdminAccountCreator | line: 15)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (score=3, reason=export { ... } from)

---

### Cycle 3 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 53)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (type: export { ... } from | spec: ./components/AdminAccountCreator | line: 15)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 4 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx
- sellsi\src\domains\admin\components\AdminAccountManager.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountCreator.jsx -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 54)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (type: export { ... } from | spec: ./components/AdminAccountCreator | line: 15)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountCreator.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 5 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountManager.jsx
- sellsi\src\domains\admin\index.js
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 54)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\pages\AdminPanelHome.jsx (type: export { ... } from | spec: ./pages/AdminPanelHome | line: 11)
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (type: import | spec: ../components/AdminAccountManager | line: 39)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\pages\AdminPanelHome.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\pages\AdminPanelHome.jsx -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (score=0, reason=import)

---

### Cycle 6 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\AdminAccountManager.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 54)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (type: export { ... } from | spec: ./components/AdminAccountManager | line: 16)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminAccountManager.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminAccountManager.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 7 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: import | spec: ./AdminPanelTable | line: 37)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 47)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (score=0, reason=import)

---

### Cycle 8 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\UserManagementTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\UserManagementTable.jsx (type: import | spec: ./UserManagementTable | line: 38)
- sellsi\src\domains\admin\components\UserManagementTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 59)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\UserManagementTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\UserManagementTable.jsx (score=0, reason=import)

---

### Cycle 9 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx (type: import | spec: ./ProductMarketplaceTable | line: 39)
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 62)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx (score=0, reason=import)

---

### Cycle 10 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\AdminGuard.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminGuard.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 16)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminGuard.jsx (type: export { ... } from | spec: ./components/AdminGuard | line: 7)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminGuard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminGuard.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 11 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\AdminLogin.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminLogin.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 38)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminLogin.jsx (type: export { ... } from | spec: ./components/AdminLogin | line: 5)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminLogin.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminLogin.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 12 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 47)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: export { ... } from | spec: ./components/AdminPanelTable | line: 17)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 13 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\FirstAdminSetup.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\FirstAdminSetup.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 50)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\FirstAdminSetup.jsx (type: export { ... } from | spec: ./components/FirstAdminSetup | line: 8)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\FirstAdminSetup.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\FirstAdminSetup.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 14 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\Manage2FA.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\Manage2FA.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 41)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Manage2FA.jsx (type: export { ... } from | spec: ./components/Manage2FA | line: 26)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Manage2FA.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\Manage2FA.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 15 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 62)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx (type: export { ... } from | spec: ./components/ProductMarketplaceTable | line: 19)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\ProductMarketplaceTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 16 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminLogin.jsx
- sellsi\src\domains\admin\components\Setup2FA.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminLogin.jsx -> sellsi\src\domains\admin\components\Setup2FA.jsx (type: import | spec: ./Setup2FA | line: 40)
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 48)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminLogin.jsx (type: export { ... } from | spec: ./components/AdminLogin | line: 5)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminLogin.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminLogin.jsx -> sellsi\src\domains\admin\components\Setup2FA.jsx (score=0, reason=import)

---

### Cycle 17 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\Setup2FA.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 48)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Setup2FA.jsx (type: export { ... } from | spec: ./components/Setup2FA | line: 25)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Setup2FA.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 18 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\Manage2FA.jsx
- sellsi\src\domains\admin\components\Setup2FA.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\Manage2FA.jsx -> sellsi\src\domains\admin\components\Setup2FA.jsx (type: import | spec: ./Setup2FA | line: 42)
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 48)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Manage2FA.jsx (type: export { ... } from | spec: ./components/Manage2FA | line: 26)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\Manage2FA.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\Setup2FA.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\Manage2FA.jsx -> sellsi\src\domains\admin\components\Setup2FA.jsx (score=0, reason=import)

---

### Cycle 19 (size=2)
**Nodes:**
- sellsi\src\domains\admin\components\UserManagementTable.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\UserManagementTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 59)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\UserManagementTable.jsx (type: export { ... } from | spec: ./components/UserManagementTable | line: 18)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\UserManagementTable.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\components\UserManagementTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 20 (size=4)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: import | spec: ./AdminPanelTable | line: 37)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx (type: import | spec: ../modals/ConfirmarPagoModal | line: 50)
- sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 29)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (score=0, reason=import)

---

### Cycle 21 (size=4)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\modals\RechazarPagoModal.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: import | spec: ./AdminPanelTable | line: 37)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\modals\RechazarPagoModal.jsx (type: import | spec: ../modals/RechazarPagoModal | line: 51)
- sellsi\src\domains\admin\modals\RechazarPagoModal.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 33)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\modals\RechazarPagoModal.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (score=0, reason=import)

---

### Cycle 22 (size=4)
**Nodes:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\modals\DevolverPagoModal.jsx
- sellsi\src\domains\admin\index.js

**Edges:**
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: import | spec: ./AdminPanelTable | line: 37)
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\modals\DevolverPagoModal.jsx (type: import | spec: ../modals/DevolverPagoModal | line: 52)
- sellsi\src\domains\admin\modals\DevolverPagoModal.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 34)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (type: export { ... } from | spec: ./components/AdminDashboard | line: 6)

**Break candidates:**
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\components\AdminDashboard.jsx (score=3, reason=export { ... } from)
- sellsi\src\domains\admin\modals\DevolverPagoModal.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)
- sellsi\src\domains\admin\components\AdminDashboard.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (score=0, reason=import)

---

### Cycle 23 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\index.js
- sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx

**Edges:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 47)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\modals\ConfirmarPagoModal.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: ? | spec:  | line: )

**Break candidates:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 24 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\index.js
- sellsi\src\domains\admin\modals\RechazarPagoModal.jsx

**Edges:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 47)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\modals\RechazarPagoModal.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\modals\RechazarPagoModal.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: ? | spec:  | line: )

**Break candidates:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 25 (size=3)
**Nodes:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx
- sellsi\src\domains\admin\index.js
- sellsi\src\domains\admin\modals\DevolverPagoModal.jsx

**Edges:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (type: import | spec: ../../../domains/admin | line: 47)
- sellsi\src\domains\admin\index.js -> sellsi\src\domains\admin\modals\DevolverPagoModal.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\admin\modals\DevolverPagoModal.jsx -> sellsi\src\domains\admin\components\AdminPanelTable.jsx (type: ? | spec:  | line: )

**Break candidates:**
- sellsi\src\domains\admin\components\AdminPanelTable.jsx -> sellsi\src\domains\admin\index.js (score=1, reason=import)

---

### Cycle 26 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 27 (size=6)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 28 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 29 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 30 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 31 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 32 (size=6)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 33 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 34 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 35 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: export { ... } from | spec: ./Step1Account | line: 4)
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 14)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (score=3, reason=export { ... } from)

---

### Cycle 36 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 37 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: export { ... } from | spec: ./Step1Account | line: 4)
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 14)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 38 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 39 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: export { ... } from | spec: ./Step1Account | line: 4)
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 14)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 40 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step1Account.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step1Account.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step1Account.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 41 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: export { ... } from | spec: ./Step2AccountType | line: 5)
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (score=3, reason=export { ... } from)

---

### Cycle 42 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 43 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: export { ... } from | spec: ./Step2AccountType | line: 5)
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 44 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 45 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: export { ... } from | spec: ./Step2AccountType | line: 5)
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 46 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2AccountType.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2AccountType.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 47 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: export { ... } from | spec: ./Step3Profile | line: 6)
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (score=3, reason=export { ... } from)

---

### Cycle 48 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 49 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: export { ... } from | spec: ./Step3Profile | line: 6)
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 50 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 51 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: export { ... } from | spec: ./Step3Profile | line: 6)
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 52 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Profile.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Profile.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Profile.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 53 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: export { ... } from | spec: ./Step4Verification | line: 7)
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (score=3, reason=export { ... } from)

---

### Cycle 54 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 55 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: export { ... } from | spec: ./Step4Verification | line: 7)
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 56 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 57 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: export { ... } from | spec: ./Step4Verification | line: 7)
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 3)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 58 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Verification.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Verification.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Verification.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 59 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: export { ... } from | spec: ./Step2Code | line: 11)
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 6)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (score=3, reason=export { ... } from)

---

### Cycle 60 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 61 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: export { ... } from | spec: ./Step2Code | line: 11)
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 6)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 62 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 63 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: export { ... } from | spec: ./Step2Code | line: 11)
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 6)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 64 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 65 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: export { ... } from | spec: ./Step3Reset | line: 12)
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 11)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (type: export { ... } from | spec: ./navigation | line: 30)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (type: export { ... } from | spec: ./TopBar | line: 7)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\navigation\index.js (score=4, reason=export { ... } from)
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (score=3, reason=export { ... } from)

---

### Cycle 66 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 67 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: export { ... } from | spec: ./Step3Reset | line: 12)
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 11)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: import | spec: ../navigation/TopBar | line: 5)
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: export { ... } from | spec: ./TopBar | line: 1)
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../../../../domains/auth | line: 26)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 68 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 69 (size=10)
**Nodes:**
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\wizard\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\shared\components\index.js
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\domains\auth\index.js

**Edges:**
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\components\Register.jsx (type: import | spec: ./Register | line: 21)
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\wizard\index.js (type: import | spec: ../wizard | line: 11)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: export { ... } from | spec: ./Step3Reset | line: 12)
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\shared\components\index.js (type: import | spec: ../../../shared/components | line: 11)
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (type: export { ... } from | spec: ./layout | line: 75)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: export { ... } from | spec: ./AppShell | line: 3)
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\hooks\useAppInitialization.js (type: import | spec: ../../hooks/useAppInitialization | line: 16)
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\hooks\usePrefetch.js (type: import | spec: ../../hooks/usePrefetch | line: 4)
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\domains\auth\index.js (type: dynamic import | spec: ../domains/auth | line: 35)
- sellsi\src\domains\auth\index.js -> sellsi\src\domains\auth\components\Login.jsx (type: export { ... } from | spec: ./components/Login | line: 5)

**Break candidates:**
- sellsi\src\shared\components\index.js -> sellsi\src\shared\components\layout\index.js (score=4, reason=export { ... } from)
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (score=3, reason=export { ... } from)
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (score=3, reason=export { ... } from)

---

### Cycle 70 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\Register.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx
- sellsi\src\domains\auth\wizard\index.js

**Edges:**
- sellsi\src\domains\auth\components\Register.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\wizard\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\index.js -> sellsi\src\domains\auth\components\Register.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 71 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 72 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 73 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 74 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 75 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 76 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step2Code.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step2Code.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step2Code.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 77 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 78 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 79 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 80 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 81 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 82 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step3Reset.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step3Reset.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step3Reset.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 83 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 84 (size=7)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 85 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 86 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 87 (size=9)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\components\Login.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\components\Login.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\components\Login.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 88 (size=8)
**Nodes:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx
- sellsi\src\domains\auth\index.js
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\components\layout\AppShell.jsx
- sellsi\src\shared\components\layout\index.js
- sellsi\src\shared\components\index.js
- sellsi\src\domains\auth\wizard\Step4Success.jsx

**Edges:**
- sellsi\src\domains\auth\components\AccountRecovery.jsx -> sellsi\src\domains\auth\index.js (type: ? | spec:  | line: )
- sellsi\src\domains\auth\index.js -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\components\layout\AppShell.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\AppShell.jsx -> sellsi\src\shared\components\layout\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\layout\index.js -> sellsi\src\shared\components\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\index.js -> sellsi\src\domains\auth\wizard\Step4Success.jsx (type: ? | spec:  | line: )
- sellsi\src\domains\auth\wizard\Step4Success.jsx -> sellsi\src\domains\auth\components\AccountRecovery.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 89 (size=4)
**Nodes:**
- sellsi\src\domains\buyer\pages\MarketplaceBuyer.jsx
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\hooks\index.js

**Edges:**
- sellsi\src\domains\buyer\pages\MarketplaceBuyer.jsx -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\hooks\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\index.js -> sellsi\src\domains\buyer\pages\MarketplaceBuyer.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 90 (size=4)
**Nodes:**
- sellsi\src\domains\marketplace\pages\Marketplace.jsx
- sellsi\src\hooks\usePrefetch.js
- sellsi\src\shared\hooks\useAppInitialization.js
- sellsi\src\shared\hooks\index.js

**Edges:**
- sellsi\src\domains\marketplace\pages\Marketplace.jsx -> sellsi\src\hooks\usePrefetch.js (type: ? | spec:  | line: )
- sellsi\src\hooks\usePrefetch.js -> sellsi\src\shared\hooks\useAppInitialization.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\useAppInitialization.js -> sellsi\src\shared\hooks\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\hooks\index.js -> sellsi\src\domains\marketplace\pages\Marketplace.jsx (type: ? | spec:  | line: )

**Break candidates:**

---

### Cycle 91 (size=3)
**Nodes:**
- sellsi\src\shared\components\navigation\index.js
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx
- sellsi\src\shared\components\navigation\TopBar\index.js

**Edges:**
- sellsi\src\shared\components\navigation\index.js -> sellsi\src\shared\components\navigation\TopBar\TopBar.jsx (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\TopBar.jsx -> sellsi\src\shared\components\navigation\TopBar\index.js (type: ? | spec:  | line: )
- sellsi\src\shared\components\navigation\TopBar\index.js -> sellsi\src\shared\components\navigation\index.js (type: ? | spec:  | line: )

**Break candidates:**

---
