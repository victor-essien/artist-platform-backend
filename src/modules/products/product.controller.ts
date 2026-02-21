import { Response, NextFunction } from "express";
import { AuthRequest } from "../../types";
import { ProductService } from "./product.service";


const productService = new ProductService();

export class ProductController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body, req.admin!.id);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProducts(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id as string);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id as string, req.body);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.deleteProduct(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { quantity, variantId } = req.body;
      const result = await productService.updateStock(req.params.id as string, quantity, variantId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async addVariant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const variant = await productService.addVariant(req.params.id as string, req.body);
      res.status(201).json({ success: true, data: variant });
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const variant = await productService.updateVariant(req.params.id as string, req.body);
      res.json({ success: true, data: variant });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.deleteVariant(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const products = await productService.getFeaturedProducts();
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await productService.getProductStats(req.params.id as string);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}