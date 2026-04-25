import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { NodeProps } from 'reactflow';

interface GroupNodeData {
  label: string;
  isDark?: boolean;
}

const GroupNode = ({ data }: NodeProps<GroupNodeData>) => {
  const labelStyle: CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  };
  const panelStyle: CSSProperties = {
    backgroundColor: 'var(--bg-elevated)',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--border-default)',
  };

  return (
    <div className="w-full h-full rounded-3xl relative pointer-events-none" style={panelStyle}>
      <div
        className="absolute -top-4 left-6 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow"
        style={labelStyle}
      >
        {data?.label}
      </div>
    </div>
  );
};

export default memo(GroupNode);

