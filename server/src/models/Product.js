import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    barcode: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Product supplier is required'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      default: 0
    },
    minimumStock: {
      type: Number,
      required: [true, 'Minimum stock threshold is required'],
      min: [0, 'Minimum stock cannot be negative'],
      default: 10
    },
    unitOfMeasure: {
      type: String,
      default: 'pcs',
      trim: true
    },
    status: {
      type: String,
      enum: ['IN STOCK', 'LOW STOCK', 'OUT OF STOCK'],
      default: 'OUT OF STOCK'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases for compatibility
productSchema.virtual('name')
  .get(function () { return this.productName; })
  .set(function (v) { this.productName = v; });

productSchema.virtual('quantityInStock')
  .get(function () { return this.quantity; })
  .set(function (v) { this.quantity = v; });

productSchema.virtual('unitPrice')
  .get(function () { return this.price; })
  .set(function (v) { this.price = v; });

productSchema.virtual('reorderLevel')
  .get(function () { return this.minimumStock; })
  .set(function (v) { this.minimumStock = v; });

// Calculate status before save
productSchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'OUT OF STOCK';
  } else if (this.quantity <= this.minimumStock) {
    this.status = 'LOW STOCK';
  } else {
    this.status = 'IN STOCK';
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
