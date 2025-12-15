/**
 * 页面过渡效果配置
 * 
 * 此文件包含所有页面过渡动画的配置选项
 * 可以在此集中管理和调整过渡效果
 */

export const transitionConfig = {
  // 默认页面过渡
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // 自定义贝塞尔曲线
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }
    },
  },

  // 快速淡入淡出（用于模态框或快速切换）
  fade: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      }
    },
  },

  // 从右侧滑入（用于新内容或下一页）
  slideRight: {
    initial: { opacity: 0, x: 50 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }
    },
  },

  // 从左侧滑入（用于返回或上一页）
  slideLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: { 
      opacity: 0, 
      x: 50,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }
    },
  },

  // 缩放效果（用于重要页面或模态框）
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }
    },
  },

  // 从下方滑入（用于底部工作表或抽屉）
  slideUp: {
    initial: { opacity: 0, y: 100 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: { 
      opacity: 0, 
      y: 100,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }
    },
  },
};

/**
 * 缓动函数预设
 * 可以在过渡配置中使用这些预设
 */
export const easingPresets = {
  // 标准缓动
  easeInOut: [0.4, 0, 0.2, 1],
  
  // 自然缓动（推荐用于页面过渡）
  natural: [0.22, 1, 0.36, 1],
  
  // 弹性缓动
  spring: [0.68, -0.55, 0.265, 1.55],
  
  // 快速缓动
  quick: [0.4, 0, 1, 1],
  
  // 平滑缓动
  smooth: [0.25, 0.1, 0.25, 1],
};

/**
 * 持续时间预设（毫秒）
 */
export const durationPresets = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  moderate: 0.4,
  slow: 0.5,
  verySlow: 0.8,
};

/**
 * 根据路由类型返回适当的过渡配置
 * @param fromPath 来源路径
 * @param toPath 目标路径
 */
export function getTransitionForRoute(fromPath: string, toPath: string) {
  // 如果是首页到其他页面，使用默认过渡
  if (fromPath === '/' && toPath !== '/') {
    return transitionConfig.default;
  }
  
  // 如果是登录/注册相关页面，使用淡入淡出
  if (
    (fromPath === '/login' && toPath === '/register') ||
    (fromPath === '/register' && toPath === '/login')
  ) {
    return transitionConfig.fade;
  }
  
  // 默认使用标准过渡
  return transitionConfig.default;
}

/**
 * 类型定义
 */
export type TransitionType = keyof typeof transitionConfig;
export type EasingType = keyof typeof easingPresets;
export type DurationType = keyof typeof durationPresets;






































