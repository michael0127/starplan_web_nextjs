/**
 * 平滑滚动到指定元素
 * @param targetId 目标元素的ID（不包含#）
 * @param offset 偏移量（默认72px，navbar高度）
 */
export function smoothScrollTo(targetId: string, offset: number = 72) {
  const element = document.getElementById(targetId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
}

/**
 * 处理hash链接的平滑滚动
 * @param href 链接的href属性
 */
export function handleSmoothScroll(href: string) {
  // 检查是否是hash链接
  if (href.includes('#')) {
    const hash = href.split('#')[1];
    if (hash) {
      smoothScrollTo(hash);
    }
  }
}














