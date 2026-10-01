import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true
    },
    transactionType: {
      type: String,
      enum: ['IN', 'OUT', 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'],
      required: [true, 'Transaction type is required'],
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    reason: {
      type: String,
      trim: true,
      default: 'General'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed the transaction is required']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases
stockTransactionSchema.virtual('transactionNumber')
  .get(function () { return this.transactionId; })
  .set(function (v) { this.transactionId = v; });

stockTransactionSchema.virtual('type')
  .get(function () { return this.transactionType; })
  .set(function (v) { this.transactionType = v; });

stockTransactionSchema.virtual('timestamp')
  .get(function () { return this.transactionDate; })
  .set(function (v) { this.transactionDate = v; });

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
export default StockTransaction;
