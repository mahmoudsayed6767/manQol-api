import express from 'express';
import {  requireAuth } from '../../services/passport';
import TransactionController from '../../controllers/transactions/transactions.controller';

const router = express.Router();

router.post('/payment',
    TransactionController.payment);

router.get('/',
    requireAuth,
    TransactionController.findAllTransactions);
    
router.get('/withoutPagenation/get',
    requireAuth,
    TransactionController.getAllTransactions);

router.get('/:transactionId',
    TransactionController.getById);

export default router;
