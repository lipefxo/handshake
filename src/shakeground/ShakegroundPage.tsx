import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import { SegmentedTabs } from '@/shared/components/SegmentedTabs';
import { AnimatedCounter } from '@/shared/components/AnimatedCounter';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { BrandWordmark } from '@/shared/components/BrandWordmark';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { StaggeredReveal } from '@/shared/components/StaggeredReveal';
import { AppIcon } from '@/shared/icons/AppIcon';
import { APP_ICON_REGISTRY, type AppIconId } from '@/shared/icons/iconRegistry';
import { themes, themeIds } from '@/themes/themeDefinitions';
import { ThemeProvider } from '@/themes/ThemeProvider';
import type { ThemeId } from '@/themes/themeTypes';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'brand', label: 'Brand Assets' },
  { id: 'colors', label: 'Colors & Tokens' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges' },
  { id: 'inputs', label: 'Inputs & Forms' },
  { id: 'cards', label: 'Cards' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'dropdowns', label: 'Dropdowns' },
  { id: 'tooltips', label: 'Tooltips' },
  { id: 'tabs', label: 'Segmented Tabs' },
  { id: 'icons', label: 'Icons' },
  { id: 'animation', label: 'Animation' },
  { id: 'themes', label: 'Themes' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div id={id} className="scroll-mt-20 mb-8">
      <h2 className="font-brand-serif text-2xl text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function Showcase({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6', className)}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function ColorSwatch({ name, value, cssVar }: { name: string; value: string; cssVar?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="h-14 w-14 rounded-lg border border-gray-200 shadow-sm"
        style={{ backgroundColor: value }}
      />
      <span className="text-[10px] font-medium text-gray-700 text-center leading-tight max-w-16">{name}</span>
      {cssVar && <span className="text-[9px] text-gray-400 font-mono">{cssVar}</span>}
    </div>
  );
}

function BrandSection() {
  return (
    <section>
      <SectionHeading id="brand" title="Brand Assets" description="Logo, wordmark, and favicon — all variants" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 p-8 bg-white flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Logo — Light Variant</p>
          <BrandLogo className="h-20 w-20" variant="light" />
        </div>
        <div className="rounded-xl border border-gray-800 p-8 bg-gray-950 flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Logo — Dark Variant</p>
          <BrandLogo className="h-20 w-20" variant="dark" />
        </div>
        <div className="rounded-xl border border-gray-200 p-8 bg-white flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Wordmark — Light Variant</p>
          <BrandWordmark className="h-8" variant="light" />
        </div>
        <div className="rounded-xl border border-gray-800 p-8 bg-gray-950 flex flex-col items-center gap-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wordmark — Dark Variant</p>
          <BrandWordmark className="h-8" variant="dark" />
        </div>
        <div className="rounded-xl border border-gray-200 p-8 bg-white flex flex-col items-center gap-4 md:col-span-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Favicon</p>
          <img src="/handshake-fav-icon.svg" alt="Favicon" className="h-12 w-12" />
        </div>
      </div>
    </section>
  );
}

function ColorsSection() {
  const brandColors = [
    { name: 'Primary', value: '#d4785c', cssVar: '--primary' },
    { name: 'Foreground', value: '#1a1a1a', cssVar: '--foreground' },
    { name: 'Background', value: '#ffffff', cssVar: '--background' },
    { name: 'Muted', value: '#f2f1ed', cssVar: '--muted' },
    { name: 'Secondary', value: '#f2f1ed', cssVar: '--secondary' },
    { name: 'Border', value: '#e5e3de', cssVar: '--border' },
    { name: 'Ring', value: '#d4785c', cssVar: '--ring' },
    { name: 'Destructive', value: '#ef4444', cssVar: '--destructive' },
  ];

  const brandIdentity = [
    { name: 'Wordmark', value: '#1a1a1a', cssVar: '--color-brand-wordmark' },
    { name: 'Wordmark (dark)', value: '#f0ede8', cssVar: '--color-brand-wordmark-on-dark' },
    { name: 'Logo', value: '#1a1a1a', cssVar: '--color-brand-logo' },
    { name: 'Logo (dark)', value: '#ffffff', cssVar: '--color-brand-logo-on-dark' },
  ];

  return (
    <section>
      <SectionHeading id="colors" title="Colors & Tokens" description="Brand palette, UI tokens, and theme color systems" />
      <Showcase label="UI Tokens">
        {brandColors.map((c) => (
          <ColorSwatch key={c.name} {...c} />
        ))}
      </Showcase>
      <Showcase label="Brand Identity">
        {brandIdentity.map((c) => (
          <ColorSwatch key={c.name} {...c} />
        ))}
      </Showcase>
      <Showcase label="Theme Palettes">
        {themeIds.map((id) => {
          const t = themes[id];
          return (
            <div key={id} className="rounded-xl border border-gray-200 p-4 w-full">
              <p className="text-sm font-medium text-gray-900 mb-3">{t.name}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(t.colors).map(([key, val]) => (
                  <ColorSwatch key={key} name={key} value={val} />
                ))}
              </div>
            </div>
          );
        })}
      </Showcase>
    </section>
  );
}

function TypographySection() {
  return (
    <section>
      <SectionHeading id="typography" title="Typography" description="Font families, scales, and utilities" />

      <Showcase label="Brand Fonts">
        <div className="w-full space-y-6">
          <div>
            <p className="text-xs text-gray-400 mb-1 font-mono">--font-brand-serif (Libre Baskerville)</p>
            <p className="font-brand-serif text-3xl text-gray-900">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 font-mono">--font-brand-sans (DM Sans)</p>
            <p className="font-brand-sans text-3xl text-gray-900">The quick brown fox jumps over the lazy dog</p>
          </div>
        </div>
      </Showcase>

      <Showcase label="Type Scale">
        <div className="w-full space-y-3">
          {[
            { cls: 'text-4xl', label: '4xl — 36px' },
            { cls: 'text-3xl', label: '3xl — 30px' },
            { cls: 'text-2xl', label: '2xl — 24px' },
            { cls: 'text-xl', label: 'xl — 20px' },
            { cls: 'text-lg', label: 'lg — 18px' },
            { cls: 'text-base', label: 'base — 16px' },
            { cls: 'text-sm', label: 'sm — 14px' },
            { cls: 'text-xs', label: 'xs — 12px' },
          ].map(({ cls, label }) => (
            <div key={cls} className="flex items-baseline gap-4">
              <span className="w-28 text-[10px] text-gray-400 font-mono shrink-0">{label}</span>
              <span className={cn(cls, 'text-gray-900')}>Handshake</span>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase label="Font Weights">
        <div className="w-full space-y-2">
          {[
            { cls: 'font-normal', label: '400 — Normal' },
            { cls: 'font-medium', label: '500 — Medium' },
            { cls: 'font-semibold', label: '600 — Semibold' },
            { cls: 'font-bold', label: '700 — Bold' },
          ].map(({ cls, label }) => (
            <div key={cls} className="flex items-baseline gap-4">
              <span className="w-28 text-[10px] text-gray-400 font-mono shrink-0">{label}</span>
              <span className={cn(cls, 'text-xl text-gray-900')}>Partnership Proposals</span>
            </div>
          ))}
        </div>
      </Showcase>
    </section>
  );
}

function ButtonsSection() {
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
  const sizes = ['xs', 'sm', 'default', 'lg'] as const;

  return (
    <section>
      <SectionHeading id="buttons" title="Buttons" description="All variants, sizes, and states" />

      <Showcase label="Variants">
        {variants.map((v) => (
          <Button key={v} variant={v}>{v}</Button>
        ))}
      </Showcase>

      <Showcase label="Sizes">
        {sizes.map((s) => (
          <Button key={s} size={s}>Size {s}</Button>
        ))}
      </Showcase>

      <Showcase label="Icon Buttons">
        <Button size="icon-xs"><AppIcon icon="ui.add" /></Button>
        <Button size="icon-sm"><AppIcon icon="ui.settings" /></Button>
        <Button size="icon"><AppIcon icon="ui.close" /></Button>
        <Button size="icon-lg"><AppIcon icon="ui.delete" /></Button>
      </Showcase>

      <Showcase label="With Icons">
        <Button><AppIcon icon="ui.mail-send" /> Send Proposal</Button>
        <Button variant="outline"><AppIcon icon="ui.share" /> Share</Button>
        <Button variant="secondary"><AppIcon icon="ui.copy" /> Duplicate</Button>
      </Showcase>

      <Showcase label="Disabled State">
        {variants.map((v) => (
          <Button key={v} variant={v} disabled>{v}</Button>
        ))}
      </Showcase>
    </section>
  );
}

function BadgesSection() {
  const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

  return (
    <section>
      <SectionHeading id="badges" title="Badges" description="Status indicators and labels" />
      <Showcase label="Variants">
        {variants.map((v) => (
          <Badge key={v} variant={v}>{v}</Badge>
        ))}
      </Showcase>
      <Showcase label="With Content">
        <Badge>Published</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="destructive">Expired</Badge>
        <Badge variant="outline">v1.2.0</Badge>
      </Showcase>
    </section>
  );
}

function InputsSection() {
  return (
    <section>
      <SectionHeading id="inputs" title="Inputs & Forms" description="Text inputs, textareas, labels, and form patterns" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="demo-input">Default Input</Label>
          <Input id="demo-input" placeholder="Enter proposal title..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-disabled">Disabled Input</Label>
          <Input id="demo-disabled" placeholder="Cannot edit..." disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-invalid">Invalid Input</Label>
          <Input id="demo-invalid" aria-invalid="true" defaultValue="bad-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demo-file">File Input</Label>
          <Input id="demo-file" type="file" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="demo-textarea">Textarea</Label>
          <Textarea id="demo-textarea" placeholder="Write your proposal description..." />
        </div>
      </div>
    </section>
  );
}

function CardsSection() {
  return (
    <section>
      <SectionHeading id="cards" title="Cards" description="Content containers with header, body, and footer" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Card</CardTitle>
            <CardDescription>A simple card with header and content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Card body content goes here. This is where the main information lives.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Action</CardTitle>
            <CardDescription>Card with an action button in the header.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">Edit</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">This card demonstrates the CardAction slot.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}

function AvatarsSection() {
  return (
    <section>
      <SectionHeading id="avatars" title="Avatars" description="User avatars with fallbacks, badges, and groups" />

      <Showcase label="Sizes">
        <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>DF</AvatarFallback></Avatar>
        <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
      </Showcase>

      <Showcase label="With Image">
        <Avatar>
          <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=JD" alt="JD" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=AK" alt="AK" />
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </Showcase>

      <Showcase label="With Badge">
        <Avatar>
          <AvatarFallback>ON</AvatarFallback>
          <AvatarBadge className="bg-emerald-500" />
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>OF</AvatarFallback>
          <AvatarBadge className="bg-gray-400" />
        </Avatar>
      </Showcase>

      <Showcase label="Group">
        <AvatarGroup>
          <Avatar><AvatarFallback>A</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>B</AvatarFallback></Avatar>
          <Avatar><AvatarFallback>C</AvatarFallback></Avatar>
          <AvatarGroupCount>+5</AvatarGroupCount>
        </AvatarGroup>
      </Showcase>
    </section>
  );
}

function DialogsSection() {
  return (
    <section>
      <SectionHeading id="dialogs" title="Dialogs" description="Modal dialogs for confirmations and forms" />
      <Showcase label="Variants">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to publish this proposal? This will make it visible to the recipient.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Destructive Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Proposal</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The proposal and all its slides will be permanently removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Showcase>
    </section>
  );
}

function DropdownsSection() {
  const [checked, setChecked] = useState(true);

  return (
    <section>
      <SectionHeading id="dropdowns" title="Dropdowns" description="Context menus and dropdown actions" />
      <Showcase label="Default">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions <AppIcon icon="ui.chevron-down" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Proposal</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem><AppIcon icon="ui.copy" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem><AppIcon icon="ui.share" /> Share</DropdownMenuItem>
              <DropdownMenuItem><AppIcon icon="ui.external-link" /> Open Preview</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
              Published
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive"><AppIcon icon="ui.delete" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Showcase>
    </section>
  );
}

function TooltipsSection() {
  return (
    <section>
      <SectionHeading id="tooltips" title="Tooltips" description="Hover hints and contextual information" />
      <TooltipProvider>
        <Showcase label="Positions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me (top)</Button>
            </TooltipTrigger>
            <TooltipContent side="top">Tooltip on top</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me (bottom)</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me (left)</Button>
            </TooltipTrigger>
            <TooltipContent side="left">Tooltip on left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me (right)</Button>
            </TooltipTrigger>
            <TooltipContent side="right">Tooltip on right</TooltipContent>
          </Tooltip>
        </Showcase>
      </TooltipProvider>
    </section>
  );
}

function TabsSection() {
  const [tab, setTab] = useState<'editor' | 'preview' | 'settings'>('editor');

  return (
    <section>
      <SectionHeading id="tabs" title="Segmented Tabs" description="Animated tab switcher with spring physics" />
      <Showcase label="Default">
        <SegmentedTabs
          value={tab}
          options={[
            { value: 'editor' as const, label: 'Editor' },
            { value: 'preview' as const, label: 'Preview' },
            { value: 'settings' as const, label: 'Settings' },
          ]}
          onValueChange={setTab}
        />
      </Showcase>
      <Showcase label="With Disabled Option">
        <SegmentedTabs
          value={tab}
          options={[
            { value: 'editor' as const, label: 'Editor' },
            { value: 'preview' as const, label: 'Preview' },
            { value: 'settings' as const, label: 'Settings', disabled: true },
          ]}
          onValueChange={setTab}
        />
      </Showcase>
    </section>
  );
}

function IconsSection() {
  const [search, setSearch] = useState('');
  const iconEntries = Object.keys(APP_ICON_REGISTRY) as AppIconId[];
  const filtered = useMemo(
    () => (search ? iconEntries.filter((id) => id.toLowerCase().includes(search.toLowerCase())) : iconEntries),
    [search, iconEntries],
  );

  const categories = useMemo(() => {
    const map = new Map<string, AppIconId[]>();
    for (const id of filtered) {
      const cat = id.split('.').slice(0, -1).join('.');
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(id);
    }
    return map;
  }, [filtered]);

  return (
    <section>
      <SectionHeading id="icons" title="Icons" description={`${iconEntries.length} icons from the @hugeicons library via AppIcon`} />
      <div className="mb-6">
        <Input placeholder="Search icons..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {[...categories.entries()].map(([cat, ids]) => (
        <div key={cat} className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{cat}</p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
            {ids.map((id) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-100 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <AppIcon icon={id} className="size-5 text-gray-700" />
                <span className="text-[9px] text-gray-500 text-center leading-tight break-all">{id.split('.').pop()}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function AnimationSection() {
  const [counterKey, setCounterKey] = useState(0);
  const [progressVal, setProgressVal] = useState(3);

  return (
    <section>
      <SectionHeading id="animation" title="Animation" description="Motion primitives: counters, staggered reveals, gradient orbs, progress" />

      <Showcase label="Animated Counter">
        <div className="flex items-center gap-4">
          <AnimatedCounter key={counterKey} value={42750} prefix="$" className="font-brand-serif text-4xl text-gray-900" />
          <Button variant="outline" size="sm" onClick={() => setCounterKey((k) => k + 1)}>
            Replay
          </Button>
        </div>
      </Showcase>

      <Showcase label="Progress Bar">
        <div className="w-full">
          <p className="text-xs text-gray-500 mb-2">Slide {progressVal} of 8</p>
          <div className="relative h-8 w-full rounded-lg overflow-hidden border border-gray-200">
            <ProgressBar current={progressVal} total={8} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="xs" onClick={() => setProgressVal((v) => Math.max(0, v - 1))}>
              Prev
            </Button>
            <Button variant="outline" size="xs" onClick={() => setProgressVal((v) => Math.min(7, v + 1))}>
              Next
            </Button>
          </div>
        </div>
      </Showcase>

      <Showcase label="Staggered Reveal">
        <StaggeredReveal className="flex gap-3">
          {['First', 'Second', 'Third', 'Fourth'].map((item) => (
            <div
              key={item}
              className="rounded-lg bg-gray-100 border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
            >
              {item}
            </div>
          ))}
        </StaggeredReveal>
      </Showcase>

      <Showcase label="Toast Variants">
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {(['success', 'error', 'info'] as const).map((variant) => {
            const styles: Record<string, string> = {
              success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
              error: 'border-red-200 bg-red-50 text-red-900',
              info: 'border-slate-200 bg-white text-slate-900',
            };
            return (
              <div key={variant} className={cn('rounded-lg border px-3 py-2 shadow-sm', styles[variant])}>
                <p className="text-sm font-medium capitalize">{variant} Toast</p>
                <p className="text-xs opacity-90">This is a {variant} notification message.</p>
              </div>
            );
          })}
        </div>
      </Showcase>
    </section>
  );
}

function ThemesSection() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('dark-minimal');
  const theme = themes[selectedTheme];

  return (
    <section>
      <SectionHeading id="themes" title="Themes" description="Presentation themes with live preview" />

      <div className="mb-6">
        <SegmentedTabs
          value={selectedTheme}
          options={themeIds.map((id) => ({ value: id, label: themes[id].name }))}
          onValueChange={setSelectedTheme}
          indicatorLayoutId="theme-picker"
        />
      </div>

      <ThemeProvider themeId={selectedTheme}>
        <div
          className="rounded-xl overflow-hidden border border-gray-200"
          style={{
            backgroundColor: theme.colors.bgPrimary,
            color: theme.colors.textPrimary,
          }}
        >
          <div className="p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: theme.colors.textTertiary }}>
                {theme.name} — {theme.description}
              </p>
              <h3
                className="text-3xl mb-2"
                style={{ fontFamily: theme.fonts.display, fontWeight: theme.fonts.displayWeight }}
              >
                Display Typography
              </h3>
              <p className="text-base" style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}>
                Body text using the theme's configured font family. This demonstrates the visual hierarchy of each theme.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-md"
                style={{ backgroundColor: theme.colors.accentMuted, color: theme.colors.accent }}
              >
                Accent Muted
              </span>
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-md text-white"
                style={{ backgroundColor: theme.colors.success }}
              >
                Success
              </span>
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-md text-white"
                style={{ backgroundColor: theme.colors.error }}
              >
                Error
              </span>
              <span
                className="inline-block px-3 py-1 text-xs font-medium rounded-md text-black"
                style={{ backgroundColor: theme.colors.warning }}
              >
                Warning
              </span>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: theme.colors.bgSurface, borderRadius: theme.style.borderRadius }}
            >
              <p className="text-sm" style={{ fontFamily: theme.fonts.mono, color: theme.colors.textSecondary }}>
                border-radius: {theme.style.borderRadius} &nbsp;|&nbsp; transition: {theme.style.slideTransitionDefault} &nbsp;|&nbsp;
                navDot: {theme.style.navDotStyle} &nbsp;|&nbsp; decorativeOpacity: {theme.style.decorativeOpacity}
              </p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </section>
  );
}

export function ShakegroundPage() {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<SectionId>('brand');
  const mainRef = useRef<HTMLElement>(null);

  const filteredSections = useMemo(
    () =>
      search
        ? SECTIONS.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
        : SECTIONS,
    [search],
  );

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-6">
          <Link to="/admin" className="flex items-center gap-2.5 text-gray-500 hover:text-gray-900 transition-colors">
            <AppIcon icon="ui.chevron-right" className="size-4 rotate-180" />
            <span className="text-sm">Admin</span>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <BrandLogo className="h-5 w-5" variant="light" />
            <h1 className="font-brand-serif text-lg text-gray-900 tracking-tight">Shakeground</h1>
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">Design System</span>
          <div className="ml-auto w-56">
            <Input
              placeholder="Search components..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto border-r border-gray-200 bg-white py-6 px-3 lg:block">
          <nav className="space-y-0.5">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={cn(
                  'w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                  activeSection === s.id
                    ? 'bg-[#d4785c]/10 text-[#d4785c] font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50',
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 px-6 py-10 lg:px-12 space-y-16">
          <div className="max-w-3xl">
            <h1 className="font-brand-serif text-4xl text-gray-900 mb-2">Shakeground</h1>
            <p className="text-gray-500 text-lg">
              The living design system for Handshake. Every component below is the <em>real</em> component used in the app — not a copy.
            </p>
          </div>

          {filteredSections.map((s) => {
            switch (s.id) {
              case 'brand': return <BrandSection key={s.id} />;
              case 'colors': return <ColorsSection key={s.id} />;
              case 'typography': return <TypographySection key={s.id} />;
              case 'buttons': return <ButtonsSection key={s.id} />;
              case 'badges': return <BadgesSection key={s.id} />;
              case 'inputs': return <InputsSection key={s.id} />;
              case 'cards': return <CardsSection key={s.id} />;
              case 'avatars': return <AvatarsSection key={s.id} />;
              case 'dialogs': return <DialogsSection key={s.id} />;
              case 'dropdowns': return <DropdownsSection key={s.id} />;
              case 'tooltips': return <TooltipsSection key={s.id} />;
              case 'tabs': return <TabsSection key={s.id} />;
              case 'icons': return <IconsSection key={s.id} />;
              case 'animation': return <AnimationSection key={s.id} />;
              case 'themes': return <ThemesSection key={s.id} />;
              default: return null;
            }
          })}
        </main>
      </div>
    </div>
  );
}
