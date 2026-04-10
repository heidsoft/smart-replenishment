import prisma from '../src/db';

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      name: '测试用户',
    },
  });
  console.log('✅ 创建用户:', user.phone);

  // 创建店铺
  const shop = await prisma.shop.upsert({
    where: { id: 'test-shop-001' },
    update: {},
    create: {
      id: 'test-shop-001',
      userId: user.id,
      name: '便民便利店',
      address: '北京市朝阳区xx街道',
      phone: '13800138000',
    },
  });
  console.log('✅ 创建店铺:', shop.name);

  // 创建供应商
  const supplier = await prisma.supplier.upsert({
    where: { id: 'test-supplier-001' },
    update: {},
    create: {
      id: 'test-supplier-001',
      shopId: shop.id,
      name: '张三批发部',
      phone: '13900139000',
      contact: '张三',
    },
  });
  console.log('✅ 创建供应商:', supplier.name);

  // 创建商品
  const products = [
    { name: '可口可乐 500ml', barcode: '6901939621103', price: 3.5, costPrice: 2.5, stock: 12, minStock: 20 },
    { name: '农夫山泉 550ml', barcode: '6921168509256', price: 2.0, costPrice: 1.2, stock: 8, minStock: 30 },
    { name: '康师傅红烧牛肉面', barcode: '6920507111001', price: 4.5, costPrice: 3.2, stock: 25, minStock: 15 },
    { name: '士力架', barcode: '6923450600012', price: 5.0, costPrice: 3.5, stock: 3, minStock: 10 },
    { name: '红牛 250ml', barcode: '6925303710019', price: 6.0, costPrice: 4.5, stock: 6, minStock: 10 },
    { name: '乐事薯片原味', barcode: '6924187221089', price: 8.0, costPrice: 5.5, stock: 18, minStock: 10 },
    { name: '旺旺雪饼', barcode: '6920734800019', price: 6.5, costPrice: 4.8, stock: 0, minStock: 8 },
    { name: '脉动 500ml', barcode: '6920925101001', price: 4.0, costPrice: 2.8, stock: 15, minStock: 12 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `test-product-${product.barcode}` },
      update: {},
      create: {
        id: `test-product-${product.barcode}`,
        shopId: shop.id,
        ...product,
        unit: '件',
      },
    });
  }
  console.log(`✅ 创建 ${products.length} 个商品`);

  // 创建销售记录（最近30天）
  const allProducts = await prisma.product.findMany({ where: { shopId: shop.id } });
  
  for (const product of allProducts) {
    // 为每个商品生成30天的销售数据
    for (let i = 0; i < 30; i++) {
      const saleTime = new Date();
      saleTime.setDate(saleTime.getDate() - i);
      
      // 随机销量 3-15
      const quantity = Math.floor(Math.random() * 13) + 3;
      
      await prisma.saleRecord.create({
        data: {
          productId: product.id,
          quantity,
          price: product.price,
          saleTime,
        },
      });
    }
  }
  console.log(`✅ 创建 ${allProducts.length * 30} 条销售记录`);

  console.log('🎉 种子数据填充完成！');
  console.log('\n测试账号:');
  console.log('  手机号: 13800138000');
  console.log('  验证码: 123456 (开发环境固定)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());