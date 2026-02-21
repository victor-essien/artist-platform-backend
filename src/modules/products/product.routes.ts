import { Router } from "express";
import { body } from "express-validator";
import { ProductController } from "./product.controller";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validator";  

const productRouter = Router();
const productController = new ProductController();


productRouter.post(
  '/',
  authenticate,
  validate([
    body('name').notEmpty(),
    body('description').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('category').notEmpty(),
    body('stock').isInt({ min: 0 }),
  ]),
  productController.create.bind(productController)
);

productRouter.get('/', productController.getAll.bind(productController));
productRouter.get('/featured', productController.getFeatured.bind(productController));
productRouter.get('/categories', productController.getCategories.bind(productController));
productRouter.get('/:id', productController.getById.bind(productController));
productRouter.put('/:id', authenticate, productController.update.bind(productController));
productRouter.delete('/:id', authenticate, productController.delete.bind(productController));
productRouter.patch('/:id/stock', authenticate, productController.updateStock.bind(productController));
productRouter.get('/:id/stats', authenticate, productController.getStats.bind(productController));
productRouter.post('/:id/variants', authenticate, productController.addVariant.bind(productController));
productRouter.put('/variants/:id', authenticate, productController.updateVariant.bind(productController));
productRouter.delete('/variants/:id', authenticate, productController.deleteVariant.bind(productController));


export default productRouter;