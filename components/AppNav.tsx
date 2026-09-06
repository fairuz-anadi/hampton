'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { PenLine, LineChart, Users, FileQuestion, Sparkles, Archive, GraduationCap, ArrowLeft } from 'lucide-react';

interface Props {
  counts: { clear: number; review: number; unusual: number };
  findings: number;
  mistakes: number;
  flaggedSteps: number;
  actions: number;
}

/** Seven destinations is too many to meet as a flat list, so they are grouped
 *  into the loop the product is actually about: you mark, you find out what
 *  happened, you do something about it. The sidebar never collapses — hiding
 *  the map behind a hover is not a saving on a screen this wide. */

/** Text that only belongs in the expanded rail. At 76px a group heading like
 *  "FIND OUT" wraps into the icons, so it fades out with the labels rather than
 *  being clipped. */
function WhenExpanded({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, animate } = useSidebar();
  const shown = animate ? open : true;
  return (
    <motion.div
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.18 }}
      aria-hidden={!shown}
      className={className}
      style={{ pointerEvents: shown ? undefined : 'none' }}
    >
      {children}
    </motion.div>
  );
}

export default function AppNav({ counts, findings, mistakes, flaggedSteps, actions }: Props) {
  const pathname = usePathname();
  const icon = 'h-[21px] w-[21px] shrink-0';

  const groups = [
    {
      title: 'Mark',
      links: [
        { label: 'Grade', href: '/grade', icon: <PenLine className={icon} />, note: `${counts.review + counts.unusual}` },
      ],
    },
    {
      title: 'Find out',
      links: [
        { label: 'You', href: '/you', icon: <LineChart className={icon} />, note: `${findings}` },
        { label: 'Class', href: '/class', icon: <Users className={icon} />, note: `${mistakes}` },
        { label: 'Questions', href: '/questions', icon: <FileQuestion className={icon} />, note: `${flaggedSteps}` },
      ],
    },
    {
      title: 'Act',
      links: [
        { label: 'Improve', href: '/improve', icon: <Sparkles className={icon} />, note: `${actions}` },
        { label: 'Students', href: '/student', icon: <GraduationCap className={icon} />, note: '' },
        { label: 'Standards', href: '/history', icon: <Archive className={icon} />, note: '' },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-5">
        <div className="sidebar-scroll flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Link href="/" className="flex items-center gap-3 px-2 py-1">
            <span className="h-8 w-8 shrink-0 rounded-lg bg-ink" />
            <WhenExpanded className="text-[24px] font-bold tracking-tight whitespace-nowrap">
              Markable
            </WhenExpanded>
          </Link>

          <div className="mt-7 flex flex-col gap-5">
            {groups.map((group) => (
              <div key={group.title} className="nav-group flex flex-col gap-1">
                <WhenExpanded className="nav-group-title px-4 pb-1 font-mono text-[22px] uppercase tracking-[0.14em] text-faint whitespace-nowrap">
                  {group.title}
                </WhenExpanded>
                {group.links.map((link) => (
                  <SidebarLink key={link.href} link={link} note={link.note} active={isActive(link.href)} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SidebarLink link={{ label: 'Back to site', href: '/', icon: <ArrowLeft className={icon} /> }} />
          {/* Condensed to two short lines that fit 240px without wrapping. The full
              "CSE 2211 — Algorithms, Mid-term" already heads every page, so spelling it
              out again here cost 170px of a rail that has to fit a laptop screen. */}
          <WhenExpanded className="px-4 font-mono text-[22px] leading-snug text-faint">
            CSE 2211 · Q4(b)
            <br />
            50 scripts
          </WhenExpanded>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
