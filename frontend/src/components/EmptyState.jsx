export default function EmptyState({ children }) {
  return (
    <div className="empty-state">
      <img src="/images/empty.svg" alt="" />
      <p>{children}</p>
    </div>
  );
}
