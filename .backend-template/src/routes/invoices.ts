import { Router } from 'express';
import { z } from 'zod';
import { invoiceQueries } from '../models/queries.ts';
import { validateBody } from '../middleware/validation.ts';
import { asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

const idOrName = z.union([z.coerce.number(), z.string().min(1)]);

const createSalesInvoiceSchema = z.object({
    invoiceNo: z.string().min(1).optional(),
    invoiceDate: z.string(),
    customerId: idOrName.optional(),
    customer: z.string().min(1).optional(),
    orderId: z.coerce.number().optional(),
    subTotal: z.coerce.number().positive(),
    cgstAmount: z.coerce.number().nonnegative().optional(),
    sgstAmount: z.coerce.number().nonnegative().optional(),
    igstAmount: z.coerce.number().nonnegative().optional(),
    totalAmount: z.coerce.number().positive(),
    dealId: z.coerce.number().optional(),
});

// Sales Invoices
router.get('/sales', asyncHandler(async (req, res) => {
    const invoices = await invoiceQueries.getSalesInvoices();
    res.json(invoices);
}));

router.post('/sales', validateBody(createSalesInvoiceSchema), asyncHandler(async (req, res) => {
    const invoice = await invoiceQueries.createSalesInvoice(req.body);
    res.status(201).json(invoice);
}));

router.put('/sales/:id', validateBody(createSalesInvoiceSchema), asyncHandler(async (req, res) => {
    const invoice = await invoiceQueries.updateSalesInvoice(String(req.params.id), req.body);
    res.json(invoice);
}));

router.delete('/sales/:id', asyncHandler(async (req, res) => {
    const result = await invoiceQueries.deleteSalesInvoice(String(req.params.id));
    res.json(result);
}));

// Purchase Invoices
router.get('/purchase', asyncHandler(async (req, res) => {
    const invoices = await invoiceQueries.getPurchaseInvoices();
    res.json(invoices);
}));

const createPurchaseInvoiceSchema = z.object({
    invoiceNo: z.string().min(1).optional(),
    invoiceDate: z.string(),
    supplierId: idOrName.optional(),
    supplier: z.string().min(1).optional(),
    orderId: z.coerce.number().optional(),
    subTotal: z.coerce.number().positive(),
    gstAmount: z.coerce.number().nonnegative().optional(),
    totalAmount: z.coerce.number().positive(),
    dealId: z.coerce.number().optional(),
});

router.post('/purchase', validateBody(createPurchaseInvoiceSchema), asyncHandler(async (req, res) => {
    const invoice = await invoiceQueries.createPurchaseInvoice(req.body);
    res.status(201).json(invoice);
}));

router.put('/purchase/:id', validateBody(createPurchaseInvoiceSchema), asyncHandler(async (req, res) => {
    const invoice = await invoiceQueries.updatePurchaseInvoice(String(req.params.id), req.body);
    res.json(invoice);
}));

router.delete('/purchase/:id', asyncHandler(async (req, res) => {
    const result = await invoiceQueries.deletePurchaseInvoice(String(req.params.id));
    res.json(result);
}));

export default router;
