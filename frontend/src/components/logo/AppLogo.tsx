import React from 'react';
import { cn } from '@/lib/utils';
import IconLight from '../../assets/icon-light.svg';
import IconDark from '../../assets/icon-dark.svg';

interface AppLogoProps {
    size?: number;
    className?: string;
    showSeparator?: boolean;
    textClassName?: string;
    mobileCompact?: boolean;
    saturation?: number;
    iconScale?: number;
    textScale?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({
    size = 28,
    className = '',
    textClassName = '',
    mobileCompact = false,
    saturation = 1,
    iconScale = 1.1,
    textScale = 0.85,
}) => {
    // Calculate proportional sizes for visual balance
    const iconSize = size * iconScale;
    const chineseSize = size * textScale;
    const englishSize = size * textScale;

    return (
        <div className={cn('flex items-center gap-3 select-none', className)}>
            {/* Audio Wave Icon - Using SVG Assets with Theme Switching */}
            <div
                className="relative"
                style={{ width: iconSize, height: iconSize, filter: `saturate(${saturation})` }}
            >
                <img
                    src={IconLight}
                    alt="TinBoker Logo"
                    className="absolute inset-0 w-full h-full object-contain block dark:hidden"
                />
                <img
                    src={IconDark}
                    alt="TinBoker Logo"
                    className="absolute inset-0 w-full h-full object-contain hidden dark:block"
                />
            </div>

            {/* Text Group */}
            <div className="flex items-baseline gap-2">
                {/* Chinese Text: 聽播客 */}
                <span
                    className={cn(
                        'font-bold tracking-wide transition-colors leading-none',
                        'text-[#1F2937] dark:text-[#E2E8F0]',
                        textClassName
                    )}
                    style={{
                        fontSize: chineseSize,
                        fontFamily: "'Noto Sans TC', system-ui, sans-serif",
                    }}
                >
                    聽播客
                </span>

                {/* English Text: TINBOKER */}
                <span
                    className={cn(
                        'font-extrabold uppercase tracking-wide transition-colors leading-none',
                        'text-[#1F2937] dark:text-[#E2E8F0]',
                        mobileCompact && 'hidden md:inline'
                    )}
                    style={{
                        fontSize: englishSize,
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '0.05em',
                    }}
                >
                    Tinboker
                </span>
            </div>
        </div>
    );
};
