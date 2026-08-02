/**
 * template.tsx 會在每次路由切換時重新掛載，
 * 因此可用來做頁面進場轉場動畫。
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
