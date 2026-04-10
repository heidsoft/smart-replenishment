import axios from 'axios';
import prisma from './db';

// 微信公众号配置
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

// 微信模板消息 ID
const TEMPLATE_IDS = {
  // 补货提醒模板
  REPLENISHMENT_ALERT: process.env.WECHAT_TEMPLATE_REPLENISHMENT || '',
};

// 缓存 access_token
let cachedAccessToken: { token: string; expires: number } | null = null;

/**
 * 获取微信 access_token
 */
async function getAccessToken(): Promise<string> {
  // 如果缓存有效，直接返回
  if (cachedAccessToken && Date.now() < cachedAccessToken.expires) {
    return cachedAccessToken.token;
  }
  
  // 请求新的 access_token
  const response = await axios.get(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}`
  );
  
  if (response.data.errcode) {
    throw new Error(`获取 access_token 失败: ${response.data.errmsg}`);
  }
  
  cachedAccessToken = {
    token: response.data.access_token,
    expires: Date.now() + (response.data.expires_in - 300) * 1000, // 提前5分钟过期
  };
  
  return cachedAccessToken.token;
}

/**
 * 发送模板消息
 */
export async function sendTemplateMessage(
  openid: string,
  templateId: string,
  data: Record<string, { value: string; color?: string }>,
  url?: string
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
      {
        touser: openid,
        template_id: templateId,
        url,
        data,
      }
    );
    
    if (response.data.errcode !== 0) {
      console.error('发送模板消息失败:', response.data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('发送模板消息异常:', error);
    return false;
  }
}

/**
 * 发送补货提醒
 */
export async function sendReplenishmentAlert(
  userId: string,
  items: Array<{ productName: string; currentStock: number; suggestQty: number }>
): Promise<boolean> {
  // 获取用户微信信息
  const wechatUser = await prisma.wechatUser.findUnique({
    where: { userId },
  });
  
  if (!wechatUser) {
    console.log(`用户 ${userId} 未绑定微信`);
    return false;
  }
  
  const itemCount = items.length;
  const itemList = items
    .slice(0, 5)
    .map(item => `${item.productName}: 补${item.suggestQty}件`)
    .join('\n');
  
  return sendTemplateMessage(
    wechatUser.openid,
    TEMPLATE_IDS.REPLENISHMENT_ALERT,
    {
      first: { value: `今日有 ${itemCount} 个商品需要补货` },
      keyword1: { value: new Date().toLocaleDateString('zh-CN') },
      keyword2: { value: itemList },
      remark: { value: '点击查看详情，一键下单补货' },
    },
    'https://smart-replenishment.cloudmesh.top/advice'
  );
}

/**
 * 微信网页授权 - 获取用户信息
 */
export async function getWechatUserInfo(code: string) {
  // 通过 code 获取 access_token 和 openid
  const tokenResponse = await axios.get(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
  );
  
  if (tokenResponse.data.errcode) {
    throw new Error(`微信授权失败: ${tokenResponse.data.errmsg}`);
  }
  
  const { access_token, openid } = tokenResponse.data;
  
  // 获取用户信息
  const userResponse = await axios.get(
    `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
  );
  
  return userResponse.data;
}

/**
 * 绑定微信
 */
export async function bindWechat(userId: string, code: string) {
  const wechatInfo = await getWechatUserInfo(code);
  
  // 检查是否已绑定
  const existing = await prisma.wechatUser.findUnique({
    where: { openid: wechatInfo.openid },
  });
  
  if (existing) {
    if (existing.userId === userId) {
      return { success: true, message: '已绑定' };
    }
    throw new Error('该微信已被其他账号绑定');
  }
  
  // 创建绑定
  await prisma.wechatUser.create({
    data: {
      userId,
      openid: wechatInfo.openid,
      unionid: wechatInfo.unionid,
    },
  });
  
  // 更新用户头像和昵称
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: wechatInfo.nickname,
      avatar: wechatInfo.headimgurl,
    },
  });
  
  return { success: true, message: '绑定成功' };
}