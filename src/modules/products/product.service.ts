import { prisma } from "../../config/database";
import { AppError } from "../../utils/error";
import { CreateProductDTO, ProductFilterQuery } from "../../types";
import {
  paginate,
  createPaginationMeta,
  generateSKU,
} from "../../utils/helper";

export class ProductService {
  async createProduct(data: CreateProductDTO, createdById: string) {
    const { variants, ...productData } = data;

    // Generate SKU if not provided
    const sku = data.sku || generateSKU("PROD");

    const createData: any = {
      ...productData,
      sku,
      createdById,
    };

    if (variants) {
      createData.variants = {
        create: variants.map((v) => ({
          name: v.name,
          sku: v.sku || generateSKU("VAR"),
          price: v.price,
          stock: v.stock,
        })),
      };
    }

    const product = await prisma.product.create({
      data: createData,
      include: {
        variants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return product;
  }

  async getProducts(query: ProductFilterQuery) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const { skip, take } = paginate(page, limit);

    const where: any = { isActive: true };

    if (query.category) {
      where.category = query.category;
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) {
        where.price.gte = parseFloat(query.minPrice);
      }
      if (query.maxPrice) {
        where.price.lte = parseFloat(query.maxPrice);
      }
    }

    if (query.inStock === "true") {
      where.stock = { gt: 0 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          variants: {
            where: { isActive: true },
          },
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: createPaginationMeta(total, page, limit),
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  async updateProduct(id: string, data: Partial<CreateProductDTO>) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const { variants, ...productData } = data;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        variants: true,
      },
    });

    return updatedProduct;
  }

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (product.orderItems.length > 0) {
      // Soft delete - deactivate instead
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: "Product deactivated (has existing orders)" };
    }

    await prisma.product.delete({
      where: { id },
    });

    return { message: "Product deleted successfully" };
  }

  async updateStock(id: string, quantity: number, variantId?: string) {
    if (variantId) {
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: quantity },
      });
      return variant;
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stock: quantity },
    });

    return product;
  }

  async addVariant(productId: string, data: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const variant = await prisma.productVariant.create({
      data: {
        ...data,
        productId,
        sku: data.sku || generateSKU("VAR"),
      },
    });

    return variant;
  }

  async updateVariant(id: string, data: any) {
    const variant = await prisma.productVariant.update({
      where: { id },
      data,
    });

    return variant;
  }

  async deleteVariant(id: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    if (variant.orderItems.length > 0) {
      // Soft delete
      await prisma.productVariant.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: "Variant deactivated (has existing orders)" };
    }

    await prisma.productVariant.delete({
      where: { id },
    });

    return { message: "Variant deleted successfully" };
  }

  async getFeaturedProducts(limit: number = 10) {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        stock: { gt: 0 },
      },
      take: limit,
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    return products;
  }

  async getCategories() {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: {
        category: true,
      },
    });

    return categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    }));
  }

  async getProductStats(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const validOrderItems = product.orderItems.filter(
      (item) => !["CANCELLED", "REFUNDED"].includes(item.order.status),
    );

    const totalSold = validOrderItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const totalRevenue = validOrderItems.reduce(
      (sum, item) => sum + parseFloat(item.totalPrice.toString()),
      0,
    );

    return {
      totalSold,
      totalRevenue,
      currentStock: product.stock,
      averageOrderQuantity: totalSold / (validOrderItems.length || 1),
    };
  }
}
