import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioHolding extends Document {
  userId: string;
  symbol: string;
  buyPrice: number;
  quantity: number;
  addedAt: Date;
}

const PortfolioSchema = new Schema<PortfolioHolding>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    buyPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

PortfolioSchema.index({ userId: 1, symbol: 1 });

export const Portfolio: Model<PortfolioHolding> =
  (models?.Portfolio as Model<PortfolioHolding>) || model<PortfolioHolding>('Portfolio', PortfolioSchema);
