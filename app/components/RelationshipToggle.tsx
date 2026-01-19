'use client';

import * as Switch from '@radix-ui/react-switch';
import { Link2 } from 'lucide-react';

interface RelationshipToggleProps {
  showLines: boolean;
  onToggle: (show: boolean) => void;
}

export function RelationshipToggle({
  showLines,
  onToggle,
}: RelationshipToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Link2 className="w-4 h-4 text-gray-500" />
      <label
        htmlFor="coop-lines"
        className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline cursor-pointer"
      >
        Co-op Lines
      </label>
      <Switch.Root
        id="coop-lines"
        checked={showLines}
        onCheckedChange={onToggle}
        className="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative data-[state=checked]:bg-blue-600 outline-none cursor-pointer transition-colors touch-manipulation"
      >
        <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-md transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
    </div>
  );
}
