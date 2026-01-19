'use client';

import { useCallback, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import {
  getAllUniqueSchools,
  getSchoolMascot,
  getSchoolActiveYears,
  isSchoolActive,
} from '../lib/dataParser';
import { getSchoolColor, getRegionColor } from '../lib/colors';
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import { MergerNode } from '../types';

// Dynamic import for react-d3-tree to avoid SSR issues
const Tree = dynamic(() => import('react-d3-tree').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  ),
});

interface BracketViewProps {
  year: number;
  selectedSchool: string | null;
  onSchoolSelect: (school: string | null) => void;
}

export function BracketView({
  year,
  selectedSchool,
  onSchoolSelect,
}: BracketViewProps) {
  const { isMobile } = useMediaQuery();
  const reducedMotion = useReducedMotion();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Build the tree data
  const treeData = useMemo(() => {
    const allSchools = getAllUniqueSchools();
    
    return {
      name: 'District 32',
      attributes: {
        type: 'district',
      },
      children: allSchools.map((school) => {
        const activeYears = getSchoolActiveYears(school);
        const isActiveNow = isSchoolActive(school, year);
        
        return {
          name: school,
          attributes: {
            mascot: getSchoolMascot(school),
            years: activeYears.length > 0
              ? `${Math.min(...activeYears)}-${Math.max(...activeYears)}`
              : 'N/A',
            isActive: isActiveNow,
            type: 'school',
          },
        };
      }),
    };
  }, [year]);

  // Container ref for measuring dimensions
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const { width, height } = node.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  // Custom node rendering
  const renderCustomNode = useCallback(
    ({ nodeDatum }: { nodeDatum: any }) => {
      const isDistrict = nodeDatum.attributes?.type === 'district';
      const isActive = nodeDatum.attributes?.isActive !== false;
      const isSelected = nodeDatum.name === selectedSchool;
      const schoolColor = isDistrict
        ? getRegionColor(32, year)
        : getSchoolColor(nodeDatum.name);

      const nodeSize = isDistrict ? 60 : isMobile ? 44 : 36;
      
      return (
        <g>
          {/* Node circle */}
          <circle
            r={nodeSize / 2}
            fill={isActive || isDistrict ? schoolColor : '#9CA3AF'}
            opacity={isActive || isDistrict ? 1 : 0.4}
            stroke={isSelected ? 'white' : 'none'}
            strokeWidth={isSelected ? 3 : 0}
            style={{
              filter: isSelected
                ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))'
                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              cursor: isDistrict ? 'default' : 'pointer',
            }}
            onClick={() => {
              if (!isDistrict) {
                onSchoolSelect(isSelected ? null : nodeDatum.name);
              }
            }}
          />
          
          {/* Node label */}
          <text
            dy={nodeSize / 2 + 16}
            textAnchor="middle"
            className="text-xs font-medium fill-gray-700 dark:fill-gray-300"
            style={{ pointerEvents: 'none' }}
          >
            {nodeDatum.name}
          </text>
          
          {/* Mascot label - hidden until historical data is available
          {!isDistrict && nodeDatum.attributes?.mascot && (
            <text
              dy={nodeSize / 2 + 30}
              textAnchor="middle"
              className="text-[10px] fill-gray-500"
              style={{ pointerEvents: 'none' }}
            >
              {nodeDatum.attributes.mascot}
            </text>
          )}
          */}
          
          {/* Years label */}
          {!isDistrict && nodeDatum.attributes?.years && (
            <text
              dy={-nodeSize / 2 - 8}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
              style={{ pointerEvents: 'none' }}
            >
              {nodeDatum.attributes.years}
            </text>
          )}
        </g>
      );
    },
    [selectedSchool, onSchoolSelect, isMobile]
  );

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-gray-50 dark:bg-gray-900">
      <Tree
        data={treeData}
        orientation="vertical"
        pathFunc="step"
        translate={{
          x: dimensions.width / 2,
          y: 60,
        }}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        nodeSize={{ x: 120, y: 140 }}
        renderCustomNodeElement={renderCustomNode}
        zoomable
        draggable
        collapsible={false}
        transitionDuration={reducedMotion ? 0 : 300}
        pathClassFunc={() => 'stroke-gray-300 dark:stroke-gray-600 stroke-2'}
      />
      
      {/* Year indicator */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2">
        <div className="text-sm text-gray-500">Viewing Year</div>
        <div className="text-2xl font-bold text-blue-600">{year}</div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2">School Status</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Active in {year}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 opacity-40" />
          <span>Not in district</span>
        </div>
      </div>
    </div>
  );
}
