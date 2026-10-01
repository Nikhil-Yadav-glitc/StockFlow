import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in server/.env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections
    console.log('[Seed] Resetting collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      StockTransaction.deleteMany({})
    ]);

    // 1. Seed Roles: Admin & Inventory Staff (ONLY these two roles as per requirements)
    console.log('[Seed] Creating demo users...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@stockflow.com',
      password: 'admin123',
      role: 'admin'
    });

    const staffUser = await User.create({
      name: 'Inventory Staff',
      email: 'staff@stockflow.com',
      password: 'staff123',
      role: 'inventory_staff'
    });

    // 2. Seed Categories (Electronics, Accessories, Networking)
    console.log('[Seed] Creating categories...');
    const catElectronics = await Category.create({
      categoryName: 'Electronics',
      description: 'Computing peripherals, core devices and smart tech',
      status: 'active'
    });

    const catAccessories = await Category.create({
      categoryName: 'Accessories',
      description: 'Cables, adapters, converters, and ergonomics',
      status: 'active'
    });

    const catNetworking = await Category.create({
      categoryName: 'Networking',
      description: 'Routers, patch cables, switches, and interface hubs',
      status: 'active'
    });

    // 3. Seed Suppliers (ABC Technologies, TechSupply Solutions)
    console.log('[Seed] Creating suppliers...');
    const supABC = await Supplier.create({
      supplierName: 'ABC Technologies',
      contact: '+1 (555) 123-4567',
      contactPerson: 'David Miller',
      email: 'orders@abctechnologies.com',
      phone: '+1 (555) 123-4567',
      address: '400 Innovation Drive, Silicon Valley, CA',
      status: 'active'
    });

    const supTechSupply = await Supplier.create({
      supplierName: 'TechSupply Solutions',
      contact: '+1 (555) 987-6543',
      contactPerson: 'Sarah Jenkins',
      email: 'sales@techsupplysolutions.com',
      phone: '+1 (555) 987-6543',
      address: '750 Logistics Way, Chicago, IL',
      status: 'active'
    });

    // 4. Seed Products (Wireless Mouse, Keyboard, HDMI Cable, Ethernet Cable, USB Hub)
    console.log('[Seed] Creating inventory products...');
    const sampleProducts = [
      {
        productName: 'Wireless Mouse',
        sku: 'ELEC-WM-01',
        barcode: '8901001001',
        description: '2.4GHz Ergonomic Optical Wireless Mouse with Nano Receiver',
        category: catElectronics._id,
        supplier: supABC._id,
        price: 24.99,
        costPrice: 12.50,
        quantity: 45,
        minimumStock: 10,
        unitOfMeasure: 'pcs'
      },
      {
        productName: 'Keyboard',
        sku: 'ELEC-KB-02',
        barcode: '8901001002',
        description: 'Mechanical Backlit USB Gaming and Typing Keyboard',
        category: catElectronics._id,
        supplier: supABC._id,
        price: 59.99,
        costPrice: 32.00,
        quantity: 6, // LOW STOCK (<= minimumStock)
        minimumStock: 15,
        unitOfMeasure: 'pcs'
      },
      {
        productName: 'HDMI Cable',
        sku: 'ACC-HDMI-03',
        barcode: '8901001003',
        description: 'High-Speed 4K Ultra-HD Gold-Plated HDMI Cable (2 Meters)',
        category: catAccessories._id,
        supplier: supTechSupply._id,
        price: 14.50,
        costPrice: 4.80,
        quantity: 80,
        minimumStock: 20,
        unitOfMeasure: 'pcs'
      },
      {
        productName: 'Ethernet Cable',
        sku: 'NET-ETH-04',
        barcode: '8901001004',
        description: 'Cat6 Snagless RJ45 High-Speed Gigabit Patch Cable (5 Meters)',
        category: catNetworking._id,
        supplier: supTechSupply._id,
        price: 9.99,
        costPrice: 3.20,
        quantity: 0, // OUT OF STOCK
        minimumStock: 10,
        unitOfMeasure: 'pcs'
      },
      {
        productName: 'USB Hub',
        sku: 'ACC-HUB-05',
        barcode: '8901001005',
        description: '4-Port Ultra-Slim USB 3.0 Data Hub with LED Power Indicator',
        category: catAccessories._id,
        supplier: supTechSupply._id,
        price: 19.99,
        costPrice: 8.00,
        quantity: 4, // LOW STOCK
        minimumStock: 10,
        unitOfMeasure: 'pcs'
      }
    ];

    const createdProducts = [];
    for (const p of sampleProducts) {
      const prod = new Product(p);
      await prod.save();
      createdProducts.push(prod);
    }

    // 5. Seed Real Stock Transactions
    console.log('[Seed] Creating initial transactions...');
    let txnIdNum = 1001;

    for (const prod of createdProducts) {
      // IN Transaction
      const inDate = new Date();
      inDate.setDate(inDate.getDate() - 7);

      const initialQty = prod.quantity + 20;

      await StockTransaction.create({
        transactionId: `TXN-IN-${txnIdNum++}`,
        product: prod._id,
        transactionType: 'IN',
        quantity: initialQty,
        previousStock: 0,
        newStock: initialQty,
        supplier: prod.supplier,
        referenceNumber: `PO-${txnIdNum}`,
        reason: 'Vendor Batch Procurement',
        performedBy: adminUser._id,
        notes: 'Initial warehouse intake inspection verified',
        transactionDate: inDate
      });

      // OUT Transaction
      if (prod.quantity > 0) {
        const outDate = new Date();
        outDate.setDate(outDate.getDate() - 2);

        await StockTransaction.create({
          transactionId: `TXN-OUT-${txnIdNum++}`,
          product: prod._id,
          transactionType: 'OUT',
          quantity: 20,
          previousStock: initialQty,
          newStock: prod.quantity,
          referenceNumber: `DISP-${txnIdNum}`,
          reason: 'Fulfillment Dispatch',
          performedBy: staffUser._id,
          notes: 'Standard distribution dispatch',
          transactionDate: outDate
        });
      }
    }

    console.log('[Seed] Database successfully initialized with master prompt specifications!');
    console.log('================================================================');
    console.log('StockFlow Demo Logins:');
    console.log('  Admin:           admin@stockflow.com / admin123 (Full Access)');
    console.log('  Inventory Staff: staff@stockflow.com / staff123 (Operations)');
    console.log('================================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedDatabase();
