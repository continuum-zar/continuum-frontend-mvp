import { Skeleton } from "./skeleton";

export function RouteSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[120px] rounded-lg" />
        <Skeleton className="h-[120px] rounded-lg" />
        <Skeleton className="h-[120px] rounded-lg" />
        <Skeleton className="h-[120px] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] rounded-lg" />
        <Skeleton className="h-[350px] rounded-lg" />
      </div>
    </div>
  );
}
