'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { motion } from 'framer-motion';
import { PenLine, LineChart, Users, GraduationCap, ArrowLeft } from 'lucide-react';

interface Props {
  counts: { clear: number; review: number; unusual: number };
  findings: number;
  mistakes: number;
}

export default function AppNav({ counts, findings, mistakes }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const icon = 'h-[18px] w-[18px] shrink-0';

  const links = [
    { label: 'Grade', href: '/grade', icon: <PenLine className={icon} />, note: `${counts.review + counts.unusual}` },
    { label: 'You', href: '/you', icon: <LineChart className={icon} />, note: `${findings}` },
    { label: 'Class', href: '/class', icon: <Users className={icon} />, note: `${mistakes}` },
    { label: 'Students', href: '/student', icon: <GraduationCap className={icon} />, note: '' },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-8">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Link href="/" className="flex items-center gap-3 px-2 py-1">
            <span className="h-7 w-7 shrink-0 rounded-lg bg-ink" />
            <motion.span
              animate={{ display: open ? 'inline-block' : 'none', opacity: open ? 1 : 0 }}
              className="text-lg font-bold tracking-tight whitespace-pre"
            >
              Markable
            </motion.span>
          </Link>

          <div className="mt-8 flex flex-col gap-1">
            {links.map((link) => (
              <SidebarLink
                key={link.href}
                link={link}
                note={link.note}
                active={pathname === link.href || pathname.startsWith(link.href + '/')}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SidebarLink
            link={{ label: 'Back to site', href: '/', icon: <ArrowLeft className={icon} /> }}
          />
          <motion.div
            animate={{ opacity: open ? 1 : 0 }}
            className="px-3 font-mono text-[10.5px] leading-relaxed text-faint"
          >
            CSE 2211 Algorithms
            <br />
            Mid-term · Q4(b)
            <br />
            50 scripts
          </motion.div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
