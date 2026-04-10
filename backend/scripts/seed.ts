import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化种子数据...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      phone: '13800138000',
      password: hashedPassword,
      name: '测试商家',
    },
  });
  console.log(`✅ 用户创建: ${user.phone} (ID: ${user.id})`);

  // 创建供应商
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '永辉批发商',
        contact: '李经理',
        phone: '13800138001',
        address: '北京市朝阳区永辉批发市场A区12号',
        userId: user.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '天猫供应链',
        contact: '王总',
        phone: '13800138002',
        address: '上海市浦东新区天猫仓库',
        userId: user.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '本地农场直供',
        contact: '张老板',
        phone: '13800138003',
        address: '河北省保定市农场基地',
        userId: user.id,
      },
    }),
  ]);
  console.log(`✅ 供应商创建: ${suppliers.length} 个`);

  // 创建商品
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: '农夫山泉 550ml',
        category: '饮料',
        unit: '瓶',
        price: 2.0,
        cost: 1.2,
        stock: 50,
        minStock: 100,
        maxStock: 500,
        userId: user.id,
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: '康师傅红烧牛肉面',
        category: '方便食品',
        unit: '包',
        price: 4.5,
        cost: 3.0,
        stock: 30,
        minStock: 50,
        maxStock: 200,
        userId: user.id,
        supplierId: suppliers[1].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: '伊利纯牛奶 250ml',
        category: '乳制品',
        unit: '盒',
        price: 3.5,
        cost: 2.2,
        stock: 20,
        minStock: 30,
        maxStock: 150,
        userId: user.id,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: '清风抽纸 3层150抽',
        category: '日用品',
        unit: '包',
        price: 5.0,
        cost: 3.5,
        stock: 15,
        minStock: 20,
        maxStock: 100,
        userId: user.id,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: '雕牌洗洁精 1kg',
        category: '日用品',
        unit: '瓶',
        price: 8.5,
        cost: 5.5,
        stock: 8,
        minStock: 15,
        maxStock: 50,
        userId: user.id,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 6 },
      update: {},
      create: {
        name: '新鲜鸡蛋 30枚装',
        category: '生鲜',
        unit: '盒',
        price: 18.0,
        cost: 12.0,
        stock: 5,
        minStock: 10,
        maxStock: 30,
        userId: user.id,
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 7 },
      update: {},
      create: {
        name: '大米 5kg 袋装',
        category: '粮油',
        unit: '袋',
        price: 32.0,
        cost: 25.0,
        stock: 12,
        minStock: 10,
        maxStock: 40,
        userId: user.id,
        supplierId: suppliers[2].id,
      },
    }),
    prisma.product.upsert({
      where: { id: 8 },
      update: {},
      create: {
        name: '可口可乐 330ml',
        category: '饮料',
        unit: '罐',
        price: 3.0,
        cost: 2.0,
        stock: 0,
        minStock: 50,
        maxStock: 200,
        userId: user.id,
        supplierId: suppliers[1].id,
      },
    }),
  ]);
  console.log(`✅ 商品创建: ${products.length} 个`);

  // 创建销售记录（过去30天）
  let saleIndex = 1;
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // 每天随机生成5-15笔销售
    const numSales = Math.floor(Math.random() * 11) + 5;
    for (let j = 0; j < numSales; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      await prisma.saleRecord.create({
        data: {
          userId: user.id,
          productId: product.id,
          quantity,
          salePrice: product.price,
          saleDate: date,
        },
      });
      saleIndex++;
    }
  }
  console.log(`✅ 销售记录创建: ${saleIndex - 1} 笔`);

  // 创建采购订单
  const order1 = await prisma.order.create({
    data: {
      orderNo: 'PO-20260410-001',
      userId: user.id,
      supplierId: suppliers[1].id,
      totalAmount: 140,
      status: 'pending',
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),

    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNo: 'PO-20260410-002',
      userId: user.id,
      supplierId: suppliers[0].id,
      totalAmount: 100,
      status: 'shipped',
      expectedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),

    },
  });

  console.log(`✅ 采购订单创建: 2 个`);

  console.log('');
  console.log('🎉 种子数据初始化完成！');
  console.log('');
  console.log('测试账号:');
  console.log('  手机号: 13800138000');
  console.log('  密码: 123456');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
