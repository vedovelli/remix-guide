import {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Form,
  Link,
  useSubmit,
  useTransition,
  useLocation,
  useSearchParams,
} from 'remix';
import { throttle } from '~/helpers';
import type { UserProfile } from '../../worker/auth';
import { Home as HomeIcon } from '~/icons/home';
import { Trending as TrendingIcon } from '~/icons/trending';
import { Bookmark as BookmarkIcon } from '~/icons/bookmark';
import { Article as ArticleIcon } from '~/icons/article';
import { Video as VideoIcon } from '~/icons/video';
import { Package as PackageIcon } from '~/icons/package';
import { Template as TemplateIcon } from '~/icons/template';
import { Example as ExampleIcon } from '~/icons/example';
import { Github as GithubIcon } from '~/icons/github';
import { Discord as DiscordIcon } from '~/icons/discord';
import { Remix as RemixIcon } from '~/icons/remix';
import { Expand as ExpandIcon } from '~/icons/expand';
import { Collapse as CollapseIcon } from '~/icons/collapse';

interface SearchInputProps {
  name: string;
  value: string | null;
}

function SearchInput({ name, value }: SearchInputProps): ReactElement {
  return (
    <div className="flex items-center flex-row-reverse text-xs">
      <input
        id="search"
        className="h-8 w-full pr-4 pl-9 py-2 dark:bg-black text-gray-700 dark:text-gray-200 border rounded-md dark:border-gray-600 focus:outline-none focus:border-gray-700 dark:focus:border-white focus:border-white appearance-none"
        type="text"
        name={name}
        defaultValue={value ?? ''}
        autoFocus
        placeholder="Search"
      />
      <label htmlFor="search" className="-mr-7">
        <svg
          className="w-4 h-4 fill-current text-gray-500 z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="black"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </label>
    </div>
  );
}

interface MenuProps {
  title?: string;
  value?: string;
  children: ReactNode;
}

function LinkMenu({ title, value, children }: MenuProps): ReactElement {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {!title ? null : (
        <div className="py-2 text-xs text-gray-500">
          <button
            type="button"
            className="relative w-full px-3 py-1.5 flex items-center gap-4 rounded-md"
            onClick={() => setExpanded((b) => !b)}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {expanded ? (
                <CollapseIcon className="w-2 h-2" />
              ) : (
                <ExpandIcon className="w-2 h-2" />
              )}
            </span>
            {title}
            {typeof value !== 'undefined' && !expanded ? (
              <div className="absolute left-32 text-gray-200">
                {value ? <span className="capitalize">{value}</span> : 'any'}
              </div>
            ) : null}
          </button>
        </div>
      )}
      {!expanded ? null : (
        <ul className="space-y-1 pb-4">
          {Array.isArray(children) ? (
            children.map((child, i) => <li key={i}>{child}</li>)
          ) : (
            <li key={i}>{children}</li>
          )}
        </ul>
      )}
    </div>
  );
}

interface SelectMenuProps {
  title: string;
  name: string;
  value: string | null;
  options: string[];
}

function SelectMenu({
  title,
  name,
  value,
  options,
}: SelectMenuProps): ReactElement {
  return (
    <div className="py-2 text-xs text-gray-500">
      <label className="relative flex items-center">
        <select
          className="w-full z-10 px-3 py-1.5 appearance-none pl-32 bg-transparent outline-none text-gray-200"
          name={name}
          defaultValue={value}
        >
          <option value="">any</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute left-3 flex gap-4">
          <span className="w-4 h-4 flex items-center justify-center">
            <ExpandIcon className="w-2 h-2" />
          </span>
          {title}
        </div>
      </label>
    </div>
  );
}

interface MenuItemProps {
  to: string;
  name?: string;
  value?: string;
  children: ReactNode;
}

function MenuItem({ to, name, value, children }: MenuItemProps): ReactElement {
  const location = useLocation();
  const [isActive, search] = useMemo(() => {
    if (!name || !value) {
      return [false, ''];
    }

    const searchParams = new URLSearchParams(location.search);
    const isActive = searchParams.get(name) === value;

    if (!isActive) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }

    return [isActive, searchParams.toString()];
  }, [location, name, value]);
  const className = `px-3 py-1.5 flex items-center gap-4 transition-colors rounded-md ${
    isActive
      ? 'shadow-inner dark:bg-gray-700'
      : 'hover:shadow-inner hover:dark:bg-gray-800'
  }`;

  if (/http:\/\/|https:\/\/|\/\//.test(to)) {
    return (
      <a
        className={className}
        href={search ? `${to}?${search}` : to}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      className={className}
      to={search ? `${to}?${search}` : to}
      prefetch="intent"
    >
      {children}
    </Link>
  );
}

interface SidebarNavigationProps {
  categories: string[];
  platforms: string[];
  languages: string[];
  versions: string[];
  user: UserProfile | null;
}

function SidebarNavigation({
  user,
  categories,
  platforms,
  languages,
  versions,
}: SidebarNavigationProps): ReactElement {
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q');
  const category = searchParams.get('category');
  const version = searchParams.get('version') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const language = searchParams.get('language') ?? '';
  const transition = useTransition();
  const handleSubmit = useMemo(() => throttle(submit, 200), [submit]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (
      transition.state === 'loading' &&
      transition.type === 'normalLoad' &&
      transition.location.pathname !== '/search'
    ) {
      formRef.current.reset();
    }
  }, [transition]);

  function handleChange(event) {
    handleSubmit(event.currentTarget);
  }

  return (
    <Form
      className="h-full flex flex-col text-sm capitalize"
      method="get"
      action="/search"
      ref={formRef}
      onChange={handleChange}
    >
      <header className="px-5 py-4">
        <SearchInput name="q" value={keyword} />
      </header>
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <section className="flex-grow px-5 py-3 divide-y overflow-y-auto">
        <LinkMenu>
          <MenuItem to="/">
            <HomeIcon className="w-4 h-4" /> Home
          </MenuItem>
          <MenuItem to="/trending">
            <TrendingIcon className="w-4 h-4" /> Trending
          </MenuItem>
          <MenuItem to="/bookmarks">
            <BookmarkIcon className="w-4 h-4" /> Bookmarks
          </MenuItem>
        </LinkMenu>
        <LinkMenu title="Categories" value={category}>
          {categories.map((category) => (
            <MenuItem
              key={category}
              to="/search"
              name="category"
              value={category}
            >
              {
                {
                  articles: <ArticleIcon className="w-4 h-4" />,
                  videos: <VideoIcon className="w-4 h-4" />,
                  packages: <PackageIcon className="w-4 h-4" />,
                  templates: <TemplateIcon className="w-4 h-4" />,
                  examples: <ExampleIcon className="w-4 h-4" />,
                }[category]
              }{' '}
              {category}
            </MenuItem>
          ))}
        </LinkMenu>
        {platforms.length === 0 ? null : (
          <SelectMenu
            title="Platform"
            name="platform"
            value={platform}
            options={platforms}
          />
        )}
        {languages.length === 0 ? null : (
          <SelectMenu
            title="Language"
            name="language"
            value={language}
            options={languages}
          />
        )}
        {versions.length === 0 ? null : (
          <SelectMenu
            title="Version"
            name="version"
            value={version}
            options={versions}
          />
        )}
        <LinkMenu title="Remix Official">
          <MenuItem to="https://remix.run/docs">
            <RemixIcon className="w-4 h-4" /> Docs
          </MenuItem>
          <MenuItem to="https://github.com/remix-run/remix">
            <GithubIcon className="w-4 h-4" /> Github
          </MenuItem>
          <MenuItem to="https://discord.com/invite/remix">
            <DiscordIcon className="w-4 h-4" /> Discord
          </MenuItem>
        </LinkMenu>
      </section>
      <footer className="px-5 py-3 border-t">
        {user ? (
          <Form action="/logout" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-md hover:shadow-md hover:shadow-inner hover:dark:bg-gray-800">
              Logout
            </button>
          </Form>
        ) : (
          <Form action="/login" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-md hover:shadow-md hover:shadow-inner hover:dark:bg-gray-800">
              Login
            </button>
          </Form>
        )}
      </footer>
    </Form>
  );
}

export default SidebarNavigation;