export function PageHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-brand-navy">
        {title}
        {count != null && (
          <span className="ml-3 text-base font-normal text-gray-400">({count})</span>
        )}
      </h1>
      <div className="mt-2 h-1 w-16 bg-brand-orange rounded" />
    </div>
  );
}
