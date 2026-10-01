# StockFlow — Smart Inventory Management Platform
*(Academic Project: Stock Maintenance System)*

StockFlow is a production-grade, full-stack inventory management platform designed in strict accordance with Software Engineering SRS and UML specifications. It features a genuine React SPA frontend, an Express REST API backend, and persistent MongoDB Atlas cloud database storage with Mongoose ODM (Zero SQLite).

---

## 🏛️ System Architecture

```
User Device (Browser)
       │
       ▼
React 18 + Vite SPA Client (Port 5173)
       │
       ▼ (Axios / HTTP REST + JWT)
Node.js + Express.js API Server (Port 5000)
       │
       ▼ (Mongoose ODM)
MongoDB Atlas Cloud Database Cluster
```

---

## 👥 User Roles & Access Control

The application strictly implements two roles with backend middleware-enforced authorization:

| Role | Permissions & Capabilities | Access Restrictions |
|---|---|---|
| **Admin** | Full system administration: Manage users, products, categories, suppliers, stock-in, stock-out, audit ledger, reports, and settings. | None |
| **Inventory Staff** | Daily operational workflow: View catalog, search products, inspect stock, record stock-in, record stock-out, view transactions, monitor low stock, and manage personal profile/password. | Strict **403 Forbidden** on administrative user-management endpoints (`/api/users`). |

---

## 📦 Core MongoDB Models (Mongoose)

### 1. `User` (`server/src/models/User.js`)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed with bcryptjs, never stored in plain-text)
- `role`: String (`admin` | `inventory_staff`)
- `isActive`: Boolean
- `createdAt`, `updatedAt`

### 2. `Product` (`server/src/models/Product.js`)
- `productName`: String
- `sku`: String (unique)
- `barcode`: String
- `description`: String
- `category`: ObjectId (ref: `Category`)
- `supplier`: ObjectId (ref: `Supplier`)
- `quantity`: Number (non-negative)
- `price`: Number (selling price)
- `costPrice`: Number (procurement cost)
- `minimumStock`: Number (reorder threshold)
- `unitOfMeasure`: String (e.g., pcs, boxes, meters)
- `status`: String (`IN STOCK` | `LOW STOCK` | `OUT OF STOCK`)
  - `quantity > minimumStock` ➔ `IN STOCK`
  - `quantity <= minimumStock AND quantity > 0` ➔ `LOW STOCK`
  - `quantity == 0` ➔ `OUT OF STOCK`
- `createdAt`, `updatedAt`

### 3. `Category` (`server/src/models/Category.js`)
- `categoryName`: String (unique)
- `description`: String
- `status`: String (`active` | `inactive`)
- `createdAt`, `updatedAt`

### 4. `Supplier` (`server/src/models/Supplier.js`)
- `supplierName`: String
- `contact`: String
- `email`: String
- `address`: String
- `status`: String (`active` | `inactive`)
- `createdAt`, `updatedAt`

### 5. `StockTransaction` (`server/src/models/StockTransaction.js`)
- `transactionId`: String (unique)
- `product`: ObjectId (ref: `Product`)
- `transactionType`: String (`IN` | `OUT` | `ADJUSTMENT`)
- `quantity`: Number
- `previousStock`: Number
- `newStock`: Number
- `reason`: String
- `referenceNumber`: String
- `performedBy`: ObjectId (ref: `User`)
- `transactionDate`: Date

---

## 📱 The 11 Core Functional Modules

1. **Authentication**: JWT login, logout, password hashing, and role validation.
2. **Dashboard**: Real MongoDB analytics: Total Products, Total Stock, Low Stock Items, Out of Stock Items, Recent Transactions, and 14-day Stock Flow trends.
3. **Products**: Complete CRUD, live search, category and status filtering, and stock status badges.
4. **Categories**: Create, read, update, and delete product categories with linked item counts.
5. **Suppliers**: Create, read, update, and delete suppliers with vendor contact channels.
6. **Stock-In**: Dedicated page to receive goods, increase product quantity, and persist `IN` transactions.
7. **Stock-Out**: Dedicated page with automated negative-inventory prevention (`"Insufficient stock available."`), decrease quantity, and persist `OUT` transactions.
8. **Transactions**: Filterable chronological audit ledger of all movements with detail modals and physical audit adjustments.
9. **Low Stock Monitoring**: Urgent replenishment dashboard with deficit calculation and 1-click restock.
10. **Reports**: Inventory valuation by category and item, historical inbound/outbound volume, and 1-click CSV exports.
11. **Users (Admin Only)**: Administrative user management to provision accounts and assign roles.
12. **Settings / Profile**: Personal profile details update and secure password change.

---

## 🚀 Getting Started

### 1. Configure MongoDB Atlas Connection

In [`server/.env`](file:///d:/Nikhil%20College/2nd%20year/1st%20sem/SE%20LAB/Project%201-%20Stock%20mangement%20system/Expirement-5/stock%20flow/server/.env):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/stockflow?retryWrites=true&w=majority
JWT_SECRET=stockflow_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
```
*(You can also use a local MongoDB URI `mongodb://localhost:27017/stockflow` if running local MongoDB service)*.

### 2. Install Dependencies

In Windows PowerShell:
```powershell
# Root dependencies
npm.cmd install

# Server dependencies
cd server
npm.cmd install

# Client dependencies
cd ../client
npm.cmd install
```

### 3. Seed Realistic Demo Data

Populate MongoDB with the master prompt's sample products (Wireless Mouse, Keyboard, HDMI Cable, Ethernet Cable, USB Hub), categories, suppliers, and users:
```powershell
npm.cmd run seed
```

### 4. Run the Application

Start both the backend REST API server and React frontend concurrently:
```powershell
npm.cmd run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **System Admin** | `admin@stockflow.com` | `admin123` | Full access: CRUD products, categories, suppliers, users, reports, audit counts |
| **Inventory Staff** | `staff@stockflow.com` | `staff123` | Operational access: View catalog, search, stock-in, stock-out, view transactions, profile |

*(1-click demo login buttons are also provided on the sign-in screen)*.

---

## 🧪 Verification & Testing Checklist

- [x] **Frontend Builds Successfully**: `npm.cmd run build` transformed 2,497 modules to `dist/` with 0 errors.
- [x] **Backend Boots Successfully**: All models, controllers, and Express routes imported and loaded.
- [x] **Zero SQLite**: MongoDB Atlas + Mongoose used exclusively across the entire codebase.
- [x] **Roles Strictly Limited**: ONLY `Admin` and `Inventory Staff` implemented.
- [x] **User Management Protected**: Non-admin users attempting to access `/api/users` receive a 403 Forbidden error.
- [x] **Negative Stock Prevention**: Stock-Out validation blocks transactions exceeding available balance with message `"Insufficient stock available."`.
