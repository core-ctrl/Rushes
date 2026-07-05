import Link from "next/link";
import { useRouter } from "next/router";

export default function ListNavigation() {
  const router = useRouter();
  
  const getTabClass = (path) => {
    const isActive = router.pathname === path;
    return `px-5 py-2 rounded-full font-medium text-sm transition-colors ${
      isActive 
        ? 'bg-red-600 text-white shadow-lg' 
        : 'text-neutral-400 hover:text-white'
    }`;
  };

  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1">
      <Link href="/my-list" className={getTabClass('/my-list')}>
        My List
      </Link>
      <Link href="/lists" className={getTabClass('/lists')}>
        Curated Lists
      </Link>
      <Link href="/lists/explore" className={getTabClass('/lists/explore')}>
        Explore
      </Link>
    </div>
  );
}
