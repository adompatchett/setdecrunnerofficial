// server/models/Runsheet.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/* --------------------------- Constants / Enums --------------------------- */
const POST_LOCATION_OPTS = ['hold_on_truck', 'office', 'setdec_storage', 'address_below'];
const PURCHASE_TYPES     = ['purchase', 'rental'];
const PD_TYPES           = ['pickup', 'delivering'];
const PAY_METHODS        = ['cheque', 'cash'];
const RD_TYPES           = ['pu', 'take'];

/* --------------------------- Subdocument Schemas ------------------------- */
// Per-stop run item rows (legacy). No _id needed if you index by array index.
const RunItemSchema = new Schema({
  item:     { type: Schema.Types.ObjectId, ref: 'Item' },
  name:     { type: String, trim: true },
  quantity: { type: Number, default: 1 },
  notes:    { type: String, trim: true, default: '' },
  photos:   { type: [String], default: [] },
}, { _id: false });

// Stop schema (used inside runsheet.stops[])
const StopSchema = new Schema({
  place:        { type: Schema.Types.ObjectId, ref: 'Place' },
  title:        { type: String, trim: true, default: 'Stop' },
  instructions: { type: String, trim: true, default: '' },
  items:        { type: [RunItemSchema], default: [] },
}, { _id: true });

// Runsheet-level attachment rows (new). Keep _id so you can delete a specific row.
const RunAttachSchema = new Schema({
  item:     { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  name:     { type: String, trim: true },
  quantity: { type: Number, default: 1 },
  notes:    { type: String, trim: true, default: '' },
  photos:   { type: [String], default: [] },
}, { _id: true });

/* --------------------------- Main Runsheet Schema ------------------------ */
const RunsheetSchema = new Schema({
  // 🔹 Scope each runsheet to a production (tenant)
  productionId: { type: Schema.Types.ObjectId, ref: 'Production', required: true, index: true },

  title:  { type: String, trim: true, default: 'Untitled' },
  status: {
    type: String,
    enum: ['draft','open','assigned','claimed','in_progress','completed','cancelled'],
    default: 'draft'
  },

  date:        { type: Date, default: null },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User' },

  photos:   { type: [String], default: [] },
  receipts: { type: [String], default: [] },

  // Supplier (optional explicit link)
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },

  // Run
  stops:  { type: [StopSchema],     default: [] },

  // NEW: runsheet-level items (attached to runsheet, not a stop)
  items:  { type: [RunAttachSchema], default: [] },

  // Type
  purchaseType: { type: String, enum: PURCHASE_TYPES, default: 'purchase' },
  pickupDate:   { type: Date, default: null },
  returnDate:   { type: Date, default: null },

  // Destination (Take To)
  takeTo: { type: Schema.Types.ObjectId, ref: 'Place', default: null },

  // Link to Set
  set: { type: Schema.Types.ObjectId, ref: 'Set', default: null },

  // Primary Contact (Person)
  contact: { type: Schema.Types.ObjectId, ref: 'Person', default: null },

  // Post-Run Destination (one-of)
  postLocation: { type: String, enum: POST_LOCATION_OPTS, default: null },
  postAddress:  { type: String, trim: true, default: '' },
  postPlace:    { type: Schema.Types.ObjectId, ref: 'Place', default: null },

  // Purchase Info
  getInvoice:    { type: Boolean, default: false },
  getDeposit:    { type: Boolean, default: false },
  chequeNumber:  { type: String, trim: true, default: '' },
  poNumber:      { type: String, trim: true, default: '' },
  paid:          { type: Boolean, default: false },
  amount:        { type: Number,  default: 0 },
  receivedBy:    { type: String, trim: true, default: '' },

  // Pickup / Delivering
  pdType:           { type: String, enum: PD_TYPES, default: null },
  pdPaymentMethod:  { type: String, enum: PAY_METHODS, default: null },
  pdDate:           { type: Date, default: null },
  pdTime:           { type: String, trim: true, default: '' },  // HH:mm
  pdInstructions:   { type: String, trim: true, default: '' },
  pdCompletedBy:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  pdCompletedOn:    { type: Date, default: null },

  // Return / Drop Off
  rdType:           { type: String, enum: RD_TYPES, default: null },
  rdCheque:         { type: Boolean, default: false },
  rdDate:           { type: Date, default: null },
  rdTime:           { type: String, trim: true, default: '' },  // HH:mm
  rdInstructions:   { type: String, trim: true, default: '' },
  rdCompletedBy:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  rdCompletedOn:    { type: Date, default: null },

  // QC on return
  qcItemsGood:     { type: Boolean, default: null },
  qcSignatureData: { type: String, default: '' },

  // Canonical list of Item IDs used anywhere on this runsheet
  itemsIndex: { type: [{ type: Schema.Types.ObjectId, ref: 'Item' }], default: [] },
}, { timestamps: true });

/* ------------------------------ Indexes ---------------------------------- */
RunsheetSchema.index({ title: 'text', status: 'text' });

// Helpful compound indexes for common queries in a multi-tenant app
RunsheetSchema.index({ productionId: 1, createdAt: -1 });
RunsheetSchema.index({ productionId: 1, status: 1, assignedTo: 1 });
RunsheetSchema.index({ productionId: 1, 'stops.place': 1 });
RunsheetSchema.index({ productionId: 1, itemsIndex: 1 });

/* --------------------------- Helpers / Hooks ------------------------------ */
function collectItemIds(rsDoc) {
  const set = new Set();

  // runsheet-level
  for (const ri of rsDoc.items || []) {
    if (ri?.item) set.add(String(ri.item));
  }
  // per-stop legacy
  for (const stop of rsDoc.stops || []) {
    for (const ri of stop.items || []) {
      if (ri?.item) set.add(String(ri.item));
    }
  }
  return Array.from(set);
}

const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(id));

RunsheetSchema.pre('save', function(next) {
  try {
    this.itemsIndex = toObjectIds(collectItemIds(this));
    next();
  } catch (e) { next(e); }
});

RunsheetSchema.statics.syncItemsIndex = async function (rsId) {
  const rs = await this.findById(rsId).select('items.item stops.items.item').lean();
  if (!rs) return;
  const ids = collectItemIds(rs);
  await this.updateOne({ _id: rsId }, { $set: { itemsIndex: toObjectIds(ids) } });
};

// Query helper to scope queries by tenant
RunsheetSchema.query.byProduction = function (prodId) {
  return this.where({ productionId: prodId });
};

export default mongoose.model('Runsheet', RunsheetSchema);




