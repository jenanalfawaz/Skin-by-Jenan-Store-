import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowDown, ArrowRight, Check, ChevronDown, Heart, Leaf, Menu, Minus, Plus, Search, ShoppingBag, Sparkles, Star, Trash2, UserRound, X } from 'lucide-react';
import {
  addStoreCartItem,
  addStoreWishlistItem,
  getStoreState,
  listStoreProducts,
  removeStoreCartItem,
  removeStoreWishlistItem,
  setStoreCartItemQuantity,
  subscribeStoreNewsletter,
  submitStoreContact,
  type StoreProduct,
  type StoreState,
} from '@/lib/store-api';

type Product = StoreProduct;
type CartRow = { id: string; qty: number };
const money = (n:number) => `$${n.toFixed(2)}`;
const queryClient = new QueryClient();

function Home() {
  const [products,setProducts] = useState<Product[]>([]);
  const [cart,setCart] = useState<CartRow[]>([]);
  const [wish,setWish] = useState<string[]>([]);
  const [storeLoading,setStoreLoading] = useState(true);
  const [storeError,setStoreError] = useState('');
  const [cartOpen,setCartOpen] = useState(false);
  const [wishOpen,setWishOpen] = useState(false);
  const [accountOpen,setAccountOpen] = useState(false);
  const [search,setSearch] = useState('');
  const [searchOpen,setSearchOpen] = useState(false);
  const [category,setCategory] = useState('Everything');
  const [sort,setSort] = useState('Featured');
  const [quizSkin,setQuizSkin] = useState('');
  const [quizGoal,setQuizGoal] = useState('');
  const [quizResult,setQuizResult] = useState<Product|null>(null);
  const [mobileMenu,setMobileMenu] = useState(false);
  const [sent,setSent] = useState(false);
  const [contactError,setContactError] = useState('');
  useEffect(()=>{
    let active=true;
    Promise.all([listStoreProducts(),getStoreState()])
      .then(([catalog,state])=>{
        if(!active)return;
        setProducts(catalog);
        applyStoreState(state);
        setStoreError('');
      })
      .catch(()=>{
        if(active)setStoreError('The store could not load right now. Please try refreshing the page.');
      })
      .finally(()=>{if(active)setStoreLoading(false);});
    return ()=>{active=false;};
  },[]);
  const applyStoreState=(state:StoreState)=>{
    setCart(state.cart.map(item=>({id:item.productId,qty:item.quantity})));
    setWish(state.wishlist);
    setStoreError('');
  };
  const cartCount=cart.reduce((n,row)=>n+row.qty,0);
  const cartProducts=cart.map(row=>({ product:products.find(p=>p.id===row.id)!,qty:row.qty })).filter(row=>row.product);
  const subtotal=cartProducts.reduce((n,row)=>n+row.product.price*row.qty,0);
  const filtered=useMemo(()=>products.filter(p=>{
    const text=`${p.name} ${p.kind} ${p.ingredients} ${p.categories.join(' ')}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (category==='Everything'||(category==='Best sellers'&&p.best)||p.categories.includes(category)) && (category!=='Best sellers'||p.best);
  }).sort((a,b)=>sort==='Price: low to high'?a.price-b.price:sort==='Price: high to low'?b.price-a.price:0),[search,category,sort]);
  const add=async(id:string)=>{
    try { applyStoreState(await addStoreCartItem({productId:id,quantity:1})); }
    catch { setStoreError('We could not add that item to your bag. Please try again.'); }
  };
  const changeQty=async(id:string,by:number)=>{
    const row=cart.find(item=>item.id===id);
    if(!row)return;
    try {
      const quantity=row.qty+by;
      applyStoreState(quantity<1?await removeStoreCartItem(id):await setStoreCartItemQuantity(id,{quantity}));
    } catch { setStoreError('We could not update your bag. Please try again.'); }
  };
  const removeCartItem=async(id:string)=>{
    try { applyStoreState(await removeStoreCartItem(id)); }
    catch { setStoreError('We could not remove that item. Please try again.'); }
  };
  const toggleWish=async(id:string)=>{
    try {
      applyStoreState(wish.includes(id)?await removeStoreWishlistItem(id):await addStoreWishlistItem(id));
    } catch { setStoreError('We could not update your wishlist. Please try again.'); }
  };
  const productById=(id:string)=>products.find(p=>p.id===id)!;
  const runQuiz=()=>{const pick=quizGoal==='Tired eyes'?'cloud':quizGoal==='Oiliness'||quizSkin==='Oily'?'matcha':quizGoal==='Dullness'?'peach':'rose';setQuizResult(productById(pick));};
  const scrollTo=(id:string)=>{document.getElementById(id)?.scrollIntoView({behavior:'smooth'});setMobileMenu(false);setSearchOpen(false);};
  const nav=[['Home','top'],['Shop','shop'],['Best Sellers','best-sellers'],['Find Your Mask','quiz']];
  return <div id="top" className="min-h-[100dvh] bg-[#faf5ee] text-[#542d3c]">
    <div className="bg-[#542d3c] px-4 py-2.5 text-center text-[11px] font-semibold tracking-[.14em] text-[#fff8f2]">A LITTLE TREAT FOR YOUR ROUTINE — FREE SHIPPING ON ORDERS $50+</div>
    <header className="sticky top-0 z-40 border-b border-[#e9d9d9] bg-[#faf5ee]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-4 lg:px-10">
        <button onClick={()=>scrollTo('top')} className="text-left" aria-label="Skin by Jenan home" data-testid="link-home-logo"><span className="serif block text-[25px] font-semibold leading-none tracking-[-.04em]">skin by jenan</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.22em] text-[#aa6a7e]">a little ritual, a lot of you</span></button>
        <nav className="hidden items-center gap-9 lg:flex">{nav.map(([label,id])=><button key={id} className={`text-[13px] font-semibold transition-colors hover:text-[#ce4f7d] ${id==='top'?'text-[#ce4f7d]':''}`} onClick={()=>scrollTo(id)}>{label}</button>)}</nav>
        <div className="flex items-center gap-2">
          <button onClick={()=>{setSearchOpen(!searchOpen);setTimeout(()=>document.getElementById('site-search')?.focus(),40);}} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f1e5e2]" aria-label="Search products" data-testid="button-open-search"><Search size={19}/></button>
          <button onClick={()=>setWishOpen(true)} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f1e5e2]" aria-label="Open wishlist" data-testid="button-open-wishlist"><Heart size={19}/>{wish.length>0&&<span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ce4f7d] px-1 text-[10px] text-white">{wish.length}</span>}</button>
          <button onClick={()=>setAccountOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f1e5e2]" aria-label="Open account" data-testid="button-open-account"><UserRound size={19}/></button>
          <button onClick={()=>setCartOpen(true)} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f1e5e2]" aria-label={`Open bag, ${cartCount} items`} data-testid="button-open-cart"><ShoppingBag size={19}/><span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ce4f7d] px-1 text-[10px] text-white">{cartCount}</span></button>
          <button className="ml-1 flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f1e5e2] lg:hidden" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={20}/></button>
        </div>
      </div>
      {searchOpen&&<div className="border-t border-[#eadadd] bg-[#fffaf5] px-5 py-4"><div className="mx-auto flex max-w-[1320px] items-center gap-3"><Search size={18} className="text-[#ce4f7d]"/><input id="site-search" value={search} onChange={e=>{setSearch(e.target.value);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}} placeholder="Search masks, patches, ingredients..." className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-[#a98b93]" aria-label="Search products" data-testid="input-product-search"/><button onClick={()=>{setSearch('');setSearchOpen(false);}} aria-label="Close search"><X size={18}/></button></div></div>}
      {mobileMenu&&<nav className="grid grid-cols-2 gap-2 border-t border-[#eadadd] px-5 py-4 lg:hidden">{nav.map(([label,id])=><button key={id} className="rounded-xl bg-[#f4e8e4] p-3 text-sm font-semibold" onClick={()=>scrollTo(id)}>{label}</button>)}</nav>}
    </header>
    <main>
      {storeLoading&&<div className="bg-[#f2e6df] px-5 py-3 text-center text-sm text-[#765966]" role="status">Loading the feel-good shelf…</div>}
      {storeError&&<div className="bg-[#fff0f1] px-5 py-3 text-center text-sm text-[#8c3449]" role="alert">{storeError}</div>}
      <section className="relative overflow-hidden px-5 pb-14 pt-10 md:pb-20 md:pt-16">
        <div className="mx-auto grid max-w-[1320px] items-center gap-8 md:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div className="relative z-10 py-4 md:py-10">
            <p className="fade-up mb-5 text-[11px] font-bold uppercase tracking-[.23em] text-[#ce4f7d]">GOOD SKIN DAYS START HERE</p>
            <h1 className="serif fade-up max-w-[620px] text-[54px] font-medium leading-[.99] tracking-[-.045em] md:text-[76px] lg:text-[88px]">A little mask,<br/><em className="font-medium text-[#ce4f7d]">a lot of glow.</em></h1>
            <p className="fade-up mt-6 max-w-[400px] text-[15px] leading-7 text-[#765966]">Feel-good skincare for real-life skin. Thoughtful little rituals, made to fit right into your kind of day.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={()=>scrollTo('shop')} className="group inline-flex items-center gap-3 rounded-full bg-[#ce4f7d] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#b83f6b]">Shop the feel-good stuff <ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></button><button onClick={()=>scrollTo('quiz')} className="rounded-full border border-[#d7bfc5] px-6 py-3.5 text-sm font-semibold transition hover:border-[#ce4f7d] hover:bg-white/60">Find your mask</button></div>
            <div className="mt-10 flex items-center gap-3 text-xs text-[#846c75]"><div className="flex -space-x-2"><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#faf5ee] bg-[#eab7c6] text-[10px] font-bold">J</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#faf5ee] bg-[#e3c6ad] text-[10px] font-bold">M</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#faf5ee] bg-[#cdd7bc] text-[10px] font-bold">A</span></div><span><strong className="text-[#542d3c]">Little rituals, big love.</strong> Made for your real routine.</span></div>
          </div>
          <div className="relative mx-auto flex min-h-[390px] w-full max-w-[590px] items-center justify-center md:min-h-[520px]">
            <div className="absolute right-[2%] top-[5%] h-[88%] w-[87%] rounded-[48%_52%_48%_52%/48%_44%_56%_52%] bg-[#f0d6d5] rotate-[-8deg]"/><div className="hero-orb absolute right-[7%] top-[11%] h-[78%] w-[76%] rounded-[50%_50%_43%_57%/46%_44%_56%_54%] rotate-[7deg] shadow-[0_30px_70px_rgba(180,88,115,.2)]"/>
            <div className="absolute right-[9%] top-[20%] h-[64%] w-[56%] rounded-[48%] border border-white/45"/>
            <div className="absolute right-[17%] top-[31%] flex h-[49%] w-[42%] rotate-[8deg] flex-col items-center justify-center rounded-[28px] border border-white/55 bg-[#fff6f0]/90 shadow-[0_25px_45px_rgba(113,44,66,.15)]"><div className="serif text-center text-[26px] font-semibold leading-[.95] text-[#a63e65]">skin<br/>by jenan</div><div className="my-4 h-px w-14 bg-[#d991a8]"/><span className="text-center text-[8px] font-bold uppercase tracking-[.18em] text-[#7d5260]">rosewater<br/>reset mask</span><span className="mt-3 rounded-full bg-[#f1c3d0] px-3 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#7d4358]">little jar, big mood</span></div>
            <div className="absolute left-[1%] top-[13%] rounded-full bg-[#fffaf5] px-4 py-3 text-[11px] font-semibold shadow-[0_8px_24px_rgba(96,53,67,.1)]">your 10-minute reset <Sparkles size={13} className="ml-1 inline text-[#ce4f7d]"/></div>
            <div className="absolute bottom-[12%] left-[3%] rotate-[-8deg] rounded-full border border-[#d8a4b2] px-4 py-2 text-[11px] font-semibold text-[#9a5a6e]">Made with care, always</div>
            <div className="serif absolute bottom-[2%] right-[4%] text-[48px] italic leading-none text-[#ce4f7d]">you, but glowing.</div>
          </div>
        </div>
        <div className="mx-auto mt-7 flex max-w-[1320px] items-center justify-between border-t border-[#e9d9d9] pt-5 text-[10px] font-semibold uppercase tracking-[.17em] text-[#987985]"><span>GOOD-FOR-YOU INGREDIENTS</span><span>SKINCARE THAT FEELS LIKE YOU</span><button onClick={()=>scrollTo('shop')} className="inline-flex items-center gap-2">SCROLL TO THE GOOD STUFF <ArrowDown size={14}/></button></div>
      </section>
      <section id="shop" className="scroll-mt-24 bg-[#fffaf5] px-5 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.22em] text-[#ce4f7d]">YOUR NEXT LITTLE RITUAL</p><h2 className="serif text-[42px] leading-tight tracking-[-.03em] md:text-[54px]">The feel-good shelf</h2></div><p className="max-w-[330px] text-sm leading-6 text-[#826b74]">Kind-to-skin favorites for the moments you want to make a little more yours.</p></div>
          <div className="mb-8 flex flex-col justify-between gap-4 border-y border-[#ecdddc] py-4 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">{['Everything','Face masks','Eye patches','Best sellers','Dryness','Tired eyes'].map(c=><button key={c} onClick={()=>{setCategory(c);scrollTo('shop');}} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${category===c?'bg-[#542d3c] text-white':'bg-[#f4e9e5] text-[#73505e] hover:bg-[#efd8df]'}`} data-testid={`filter-${c.toLowerCase().replaceAll(' ','-')}`}>{c}</button>)}</div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#7b626c]">Sort by <span className="relative"><select value={sort} onChange={e=>setSort(e.target.value)} className="appearance-none rounded-full border border-[#e5d3d5] bg-transparent py-2 pl-3 pr-8 text-xs text-[#542d3c] outline-none" aria-label="Sort products"><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"/></span></label>
          </div>
          {storeLoading?<div className="rounded-3xl bg-[#f7eeea] px-6 py-16 text-center text-sm text-[#826b74]">Getting the shelf ready…</div>:filtered.length===0?<div className="rounded-3xl bg-[#f7eeea] px-6 py-16 text-center"><p className="serif text-3xl">No little rituals found</p><p className="mt-2 text-sm text-[#826b74]">Try another search or category.</p><button onClick={()=>{setSearch('');setCategory('Everything');}} className="mt-5 rounded-full bg-[#ce4f7d] px-5 py-2.5 text-sm font-semibold text-white">Show everything</button></div>:<div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(p=><ProductCard key={p.id} p={p} wished={wish.includes(p.id)} onWish={()=>toggleWish(p.id)} onAdd={()=>add(p.id)}/>)}</div>}
          <div className="mt-12 flex justify-center"><button onClick={()=>{setCategory('Everything');setSearch('');}} className="rounded-full border border-[#d8bdc4] px-6 py-3 text-sm font-semibold hover:border-[#ce4f7d]">See the whole shelf <ArrowRight size={15} className="ml-2 inline"/></button></div>
        </div>
      </section>
      <section id="best-sellers" className="scroll-mt-24 bg-[#f2e6df] px-5 py-14 md:py-20">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 md:grid-cols-[.85fr_1.15fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[.15em] text-[#a85370]"><Star size={13} fill="currentColor"/> THE JENAN APPROVED LIST</span><h2 className="serif mt-5 text-[43px] leading-[1.05] tracking-[-.03em] md:text-[58px]">The ones you<br/><em>come back to.</em></h2><p className="mt-5 max-w-[390px] text-sm leading-7 text-[#806671]">Our most-loved moments of self-care, picked by the people who know a good mask day when they feel one.</p><button onClick={()=>{setCategory('Best sellers');scrollTo('shop');}} className="mt-7 rounded-full bg-[#542d3c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#754658]">Shop best sellers <ArrowRight size={15} className="ml-2 inline"/></button></div>
          <div className="grid grid-cols-2 gap-4">{products.filter(p=>p.best).slice(0,2).map((p,i)=><div key={p.id} className={`relative overflow-hidden rounded-[28px] p-5 ${i?'bg-[#d9dfce]':'bg-[#f0cbd4]'}`}><div className="serif text-[13px] font-semibold uppercase tracking-[.13em] text-[#744653]">{i?'Cool down, glow up':'The Sunday reset'}</div><div className={`mx-auto my-5 flex h-[150px] w-[150px] items-center justify-center rounded-full ${p.color}`}><Jar name={p.name} small/></div><div className="flex items-end justify-between gap-2"><div><p className="serif text-xl">{p.name}</p><p className="mt-1 text-xs text-[#765966]">{money(p.price)} · <Star size={11} fill="currentColor" className="inline"/> {p.rating}</p></div><button onClick={()=>add(p.id)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#542d3c] text-white hover:bg-[#ce4f7d]" aria-label={`Add ${p.name} to bag`}><Plus size={18}/></button></div></div>)}</div>
        </div>
      </section>
      <section id="quiz" className="scroll-mt-24 px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1120px] overflow-hidden rounded-[34px] bg-[#572d40] md:grid-cols-[.8fr_1.2fr]">
          <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-[#e9afbf] p-8"><div className="absolute h-[210px] w-[210px] rounded-full border border-[#fff7ef]/60"/><div className="absolute h-[160px] w-[160px] rounded-full border border-[#fff7ef]/50"/><div className="serif relative text-center text-[38px] leading-[.96] text-[#70374f]">A mask<br/><em>that gets you.</em></div><Leaf className="absolute bottom-8 left-8 rotate-[-25deg] text-[#9a596f]" size={29}/><Sparkles className="absolute right-9 top-8 text-[#fff7ef]" size={22}/></div>
          <div className="p-7 text-[#fff8f2] md:p-11"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#f2b6c9]">THE TWO-QUESTION MATCHMAKER</p><h2 className="serif mt-3 text-[38px] leading-tight md:text-[46px]">Find your mask moment</h2><p className="mt-3 text-sm text-[#e8cbd4]">A couple of quick picks. One little ritual, picked for you.</p>
            <div className="mt-7"><p className="mb-3 text-sm font-semibold">1. What does your skin usually feel like?</p><div className="flex flex-wrap gap-2">{['Dry','Oily','A bit of both','Not sure'].map(v=><QuizChoice key={v} value={v} active={quizSkin===v} onClick={()=>{setQuizSkin(v);setQuizResult(null);}}/>)}</div></div>
            <div className="mt-6"><p className="mb-3 text-sm font-semibold">2. What would feel good today?</p><div className="flex flex-wrap gap-2">{['Dryness','Tired eyes','Dullness','Oiliness'].map(v=><QuizChoice key={v} value={v} active={quizGoal===v} onClick={()=>{setQuizGoal(v);setQuizResult(null);}}/>)}</div></div>
            <button disabled={!quizSkin||!quizGoal} onClick={runQuiz} className="mt-7 rounded-full bg-[#f3bdce] px-5 py-3 text-sm font-bold text-[#542d3c] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">Show me my match <ArrowRight size={15} className="ml-2 inline"/></button>
            {quizResult&&<div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-white/10 p-4" aria-live="polite"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#f2b6c9]">YOUR LITTLE MATCH</p><p className="serif mt-1 text-xl">{quizResult.name}</p><p className="mt-1 text-xs text-[#e8cbd4]">{quizResult.desc}</p></div><button onClick={()=>add(quizResult.id)} className="shrink-0 rounded-full bg-[#f3bdce] px-4 py-2.5 text-xs font-bold text-[#542d3c]">Add · {money(quizResult.price)}</button></div>}
            <p className="mt-4 text-[10px] leading-5 text-[#cdb0bb]">A fun starting point, not skincare advice. Everyone's skin is their own.</p>
          </div>
        </div>
      </section>
      <section className="bg-[#eef0e4] px-5 py-16 md:py-20"><div className="mx-auto max-w-[1320px]"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#74805e]">A LITTLE ABOUT WHAT'S INSIDE</p><h2 className="serif mt-3 text-[42px] leading-tight md:text-[54px]">Good ingredients.<br/><em>Good company.</em></h2></div><p className="max-w-[370px] text-sm leading-7 text-[#68705b]">We like ingredients with a purpose and formulas that feel lovely to use. No complicated routine required.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">{[{n:'01',name:'Rosewater',line:'A refreshing, comforting classic.',tone:'bg-[#f3d5dc]',plant:'ROSE'}, {n:'02',name:'Matcha',line:'A fresh-feeling favorite for mask time.',tone:'bg-[#d9e0ca]',plant:'MATCHA'}, {n:'03',name:'Aloe vera',line:'A familiar hydrator for a soft finish.',tone:'bg-[#f0ddc8]',plant:'ALOE'}].map(item=><article key={item.n} className={`${item.tone} relative min-h-[230px] overflow-hidden rounded-[28px] p-7`}><span className="text-[10px] font-bold tracking-[.2em] text-[#805868]">INGREDIENT {item.n}</span><div className="absolute right-7 top-8 flex h-[100px] w-[100px] items-center justify-center rounded-full border border-white/80 text-[11px] font-semibold tracking-[.2em] text-[#8a5b66]">{item.plant}</div><h3 className="serif mt-10 text-[32px]">{item.name}</h3><p className="mt-2 text-sm text-[#785e65]">{item.line}</p></article>)}</div>
        </div></section>
      <section className="px-5 py-16 md:py-20"><div className="mx-auto max-w-[1320px]"><div className="mb-8 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ce4f7d]">A NOTE FROM YOUR SKIN FRIEND</p><h2 className="serif mt-3 text-[42px] md:text-[52px]">Tiny tips, lovely rituals</h2></div><span className="hidden text-xs text-[#9a7b85] md:block">Little reminders, no rulebook.</span></div><div className="grid gap-5 md:grid-cols-3">{[{n:'01 / SLOW DOWN',title:'Give your mask its moment.',body:'Set aside 10–15 minutes to unwind. Follow the directions on your product and rinse when it is time.'},{n:'02 / KEEP IT SIMPLE',title:'A little goes a long way.',body:'Start with clean skin and a comfortable amount. Your routine does not need to be a ten-step production.'},{n:'03 / MAKE IT YOURS',title:'Pick a ritual you enjoy.',body:'A favorite playlist, a cup of tea, or just a quiet few minutes. The best routine is one that feels good to you.'}].map((tip,i)=><article key={tip.n} className={`rounded-[26px] p-7 ${i===1?'bg-[#f4e4e7]':'bg-[#f5eee5]'}`}><p className="text-[10px] font-bold tracking-[.19em] text-[#bd6481]">{tip.n}</p><h3 className="serif mt-6 text-[27px] leading-tight">{tip.title}</h3><p className="mt-3 text-sm leading-6 text-[#806975]">{tip.body}</p></article>)}</div></div></section>
      <section className="overflow-hidden bg-[#e8c2c9] px-5 py-12"><div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d4c62]">A LITTLE SOMETHING FOR YOU</p><h2 className="serif mt-2 text-[34px] md:text-[42px]">Your next mask moment is 10% sweeter.</h2><p className="mt-2 text-sm text-[#754f5b]">Join our notes for new rituals, little offers, and feel-good reminders.</p></div><Newsletter/></div></section>
      <section id="contact" className="scroll-mt-24 bg-[#fffaf5] px-5 py-16 md:py-20"><div className="mx-auto grid max-w-[1120px] gap-12 md:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ce4f7d]">A HUMAN ON THE OTHER SIDE</p><h2 className="serif mt-3 text-[44px] leading-tight">Say hello,<br/><em>skin friend.</em></h2><p className="mt-4 max-w-[350px] text-sm leading-7 text-[#806975]">Questions about a product or just want to share your favorite mask moment? Leave a note and we'll be in touch.</p><div className="mt-8 space-y-4 border-t border-[#eadbdd] pt-5 text-sm"><p><span className="mr-3 text-[#ce4f7d]">01</span> hello@skinbyjenan.com</p><p><span className="mr-3 text-[#ce4f7d]">02</span> Monday–Friday, 9–5</p></div></div>
          <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);try{await submitStoreContact({name:String(values.get('name')??''),email:String(values.get('email')??''),message:String(values.get('message')??'')});setSent(true);setContactError('');form.reset();}catch{setContactError('We could not save your note. Please try again.');}}} className="rounded-[28px] bg-[#f7eee9] p-6 md:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold">Your name<input required minLength={2} name="name" placeholder="What should we call you?" className="mt-2 w-full rounded-xl border border-[#e3cfd2] bg-[#fffaf7] px-4 py-3 text-sm font-normal outline-none focus:border-[#ce4f7d]" data-testid="input-contact-name"/></label><label className="text-xs font-semibold">Email address<input required type="email" name="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-[#e3cfd2] bg-[#fffaf7] px-4 py-3 text-sm font-normal outline-none focus:border-[#ce4f7d]" data-testid="input-contact-email"/></label></div><label className="mt-4 block text-xs font-semibold">What's on your mind?<textarea required minLength={10} name="message" rows={4} placeholder="Tell us a little..." className="mt-2 w-full resize-y rounded-xl border border-[#e3cfd2] bg-[#fffaf7] px-4 py-3 text-sm font-normal outline-none focus:border-[#ce4f7d]" data-testid="input-contact-message"/></label>{sent&&<p role="status" className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#527453]"><Check size={16}/> Your note is saved for the store team. Thanks for saying hello!</p>}{contactError&&<p role="alert" className="mt-4 text-sm text-[#8c3449]">{contactError}</p>}<button type="submit" className="mt-5 rounded-full bg-[#ce4f7d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#b83f6b]" data-testid="button-contact-submit">Send your note <ArrowRight size={15} className="ml-2 inline"/></button><p className="mt-3 text-[10px] text-[#917782]">Your note is saved in the store database. Replies are handled separately.</p></form>
        </div></section>
    </main>
    <footer className="bg-[#542d3c] px-5 py-10 text-[#fff8f2]"><div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 md:flex-row"><div><p className="serif text-3xl">skin by jenan</p><p className="mt-2 text-sm text-[#d9bdc7]">A little mask, A lot of glow</p></div><div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold text-[#f2dce3]">{nav.map(([label,id])=><button key={id} onClick={()=>scrollTo(id)}>{label}</button>)}<button onClick={()=>scrollTo('contact')}>Contact</button></div><p className="text-[10px] text-[#d9bdc7]">© 2025 Skin by Jenan. Your little ritual starts here.</p></div></footer>
     {(cartOpen||wishOpen||accountOpen)&&<div className="fixed inset-0 z-50 flex justify-end"><button className="absolute inset-0 bg-[#38212c]/45" onClick={()=>{setCartOpen(false);setWishOpen(false);setAccountOpen(false);}} aria-label="Close panel"/><aside className="relative flex h-full w-full max-w-[440px] flex-col bg-[#fffaf5] shadow-2xl"><div className="flex items-center justify-between border-b border-[#eadbdd] px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ce4f7d]">{cartOpen?'YOUR LITTLE BAG':wishOpen?'SAVED FOR LATER':'YOUR ACCOUNT'}</p><h2 className="serif mt-1 text-3xl">{cartOpen?`Your bag (${cartCount})`:wishOpen?`Your wishlist (${wish.length})`:'Hello, skin friend'}</h2></div><button onClick={()=>{setCartOpen(false);setWishOpen(false);setAccountOpen(false);}} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f2e5e4]" aria-label="Close drawer"><X size={20}/></button></div>
       <div className="flex-1 overflow-y-auto px-6 py-4">{cartOpen?(cartProducts.length===0?<EmptyPanel title="Your bag is taking a breather." text="Add a little ritual and it will show up here." onClick={()=>{setCartOpen(false);scrollTo('shop');}}/>:cartProducts.map(({product:p,qty})=><div key={p.id} className="flex gap-4 border-b border-[#eadbdd] py-5"><div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ${p.color}`}><Jar name={p.name} small/></div><div className="min-w-0 flex-1"><p className="serif text-lg leading-tight">{p.name}</p><p className="mt-1 text-xs text-[#8b707a]">{money(p.price)}</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-3 rounded-full border border-[#e2cfd3] px-2 py-1"><button onClick={()=>changeQty(p.id,-1)} aria-label={`Decrease ${p.name} quantity`}><Minus size={13}/></button><span className="min-w-4 text-center text-xs">{qty}</span><button onClick={()=>changeQty(p.id,1)} aria-label={`Increase ${p.name} quantity`}><Plus size={13}/></button></div><button onClick={()=>removeCartItem(p.id)} className="text-xs text-[#9b7180] hover:text-[#ce4f7d]"><Trash2 size={15} className="inline"/> Remove</button></div></div></div>)):wishOpen?(wish.length===0?<EmptyPanel title="No saved favorites yet." text="Tap the heart on anything that catches your eye." onClick={()=>{setWishOpen(false);scrollTo('shop');}}/>:wish.map(id=>{const p=productById(id);return <div key={id} className="flex gap-4 border-b border-[#eadbdd] py-5"><div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ${p.color}`}><Jar name={p.name} small/></div><div className="flex-1"><p className="serif text-lg">{p.name}</p><p className="mt-1 text-xs">{money(p.price)}</p><div className="mt-3 flex gap-4"><button onClick={()=>add(p.id)} className="text-xs font-bold text-[#ce4f7d]">Add to bag</button><button onClick={()=>toggleWish(p.id)} className="text-xs text-[#9b7180]">Remove</button></div></div></div>})):<div className="mt-4 rounded-[28px] bg-[#f7eee9] p-7"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efd8df] text-[#ce4f7d]"><UserRound size={24}/></div><p className="serif mt-5 text-2xl">Browsing as a guest</p><p className="mt-2 text-sm leading-6 text-[#806975]">Your bag and favorites are saved in your secure browser session. Account sign-in is not enabled in this storefront demo.</p><button onClick={()=>{setAccountOpen(false);scrollTo('shop');}} className="mt-5 rounded-full bg-[#542d3c] px-5 py-3 text-sm font-semibold text-white">Explore the shelf <ArrowRight size={15} className="ml-2 inline"/></button></div>}</div>
       {cartOpen&&<div className="border-t border-[#eadbdd] p-6"><div className="flex justify-between text-sm"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className="mt-3 rounded-xl bg-[#f3e8e3] p-3 text-xs leading-5 text-[#775c67]">This is a storefront demo. No checkout or payment is available, and you will not be charged.</p><button onClick={()=>{setCartOpen(false);scrollTo('shop');}} className="mt-4 w-full rounded-full bg-[#542d3c] py-3.5 text-sm font-semibold text-white">Keep browsing <ArrowRight size={15} className="ml-2 inline"/></button></div>}
    </aside></div>}
  </div>;
}

function ProductCard({p,wished,onWish,onAdd}: {p:Product;wished:boolean;onWish:()=>void;onAdd:()=>void}) {
  return <article className="group" data-testid={`card-product-${p.id}`}><div className={`relative flex aspect-[.91] items-center justify-center overflow-hidden rounded-[27px] ${p.color}`}><span className="absolute left-4 top-4 rounded-full bg-[#fffaf1]/85 px-3 py-1.5 text-[9px] font-bold tracking-[.13em] text-[#784957]">{p.badge}</span><button onClick={onWish} aria-label={wished?`Remove ${p.name} from wishlist`:`Add ${p.name} to wishlist`} className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#fffaf1]/85 transition hover:scale-105 ${wished?'text-[#ce4f7d]':'text-[#765565]'}`} data-testid={`button-wishlist-${p.id}`}><Heart size={17} fill={wished?'currentColor':'none'}/></button><div className="transition-transform duration-500 group-hover:scale-[1.04]"><Jar name={p.name}/></div><div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full bg-[#fffaf1]/85 px-3 py-1.5 text-[10px] font-semibold"><Star size={11} className="text-[#c88a42]" fill="currentColor"/> {p.rating} <span className="text-[#9a7c83]">({p.reviews})</span></div></div><div className="flex items-start justify-between gap-2 px-1 pt-4"><div><h3 className="serif text-[21px] leading-tight">{p.name}</h3><p className="mt-1.5 text-xs text-[#927781]">{p.kind}</p><p className="mt-2 text-sm font-semibold">{money(p.price)}</p></div><button onClick={onAdd} aria-label={`Add ${p.name} to bag`} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0d9df] text-[#8f415e] transition hover:bg-[#ce4f7d] hover:text-white" data-testid={`button-add-${p.id}`}><Plus size={19}/></button></div></article>;
}
function Jar({name,small=false}:{name:string;small?:boolean}) {
  const mask=name.toLowerCase().includes('mask')||name.toLowerCase().includes('duo');
  return <div className={`relative flex flex-col items-center justify-center ${small?'scale-[.68]':''}`}><div className="h-3 w-[90px] rounded-t-md bg-[#d8b7a6] shadow-[inset_0_-2px_0_rgba(96,50,60,.13)]"/><div className="relative flex h-[104px] w-[108px] flex-col items-center justify-center rounded-b-[18px] border border-white/55 bg-[#fff8f0]/90 shadow-[0_17px_27px_rgba(91,46,64,.15)]"><span className="serif text-[16px] font-semibold leading-none text-[#a64b6a]">skin by jenan</span><span className="my-2 h-px w-9 bg-[#dfa4b2]"/><span className="max-w-[78px] text-center text-[7px] font-bold uppercase leading-tight tracking-[.12em] text-[#76505c]">{mask?name.replace(/ mask| duo/ig,''):name.replace(/ eye patches/ig,'')}</span><span className="absolute bottom-2 text-[6px] tracking-[.14em] text-[#ad8390]">{mask?'FACE MASK':'EYE PATCHES'}</span></div></div>;
}
function QuizChoice({value,active,onClick}:{value:string;active:boolean;onClick:()=>void}) { return <button onClick={onClick} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${active?'border-[#f3bdce] bg-[#f3bdce] text-[#542d3c]':'border-[#9c6f80] text-[#f5e4e9] hover:bg-white/10'}`}>{active&&<Check size={12} className="mr-1 inline"/>}{value}</button>; }
function EmptyPanel({title,text,onClick}:{title:string;text:string;onClick:()=>void}) { return <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e1e5] text-[#ce4f7d]"><Sparkles size={26}/></div><p className="serif mt-5 text-2xl">{title}</p><p className="mt-2 max-w-[250px] text-sm leading-6 text-[#8b707a]">{text}</p><button onClick={onClick} className="mt-5 rounded-full bg-[#ce4f7d] px-5 py-2.5 text-xs font-bold text-white">Explore the shelf</button></div>; }
function Newsletter() {
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  if(done)return <p role="status" className="rounded-full bg-[#fffaf5] px-6 py-4 text-sm font-semibold text-[#542d3c]"><Check size={16} className="mr-2 inline"/>Your signup has been saved. Thank you!</p>;
  return <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);setSaving(true);setError('');try{await subscribeStoreNewsletter({email:String(values.get('email')??'')});setDone(true);form.reset();}catch{setError('We could not save your signup. Please try again.');}finally{setSaving(false);}}} className="w-full max-w-[410px]">
    <div className="flex gap-2"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input required type="email" id="newsletter-email" name="email" placeholder="Your email address" className="min-w-0 flex-1 rounded-full border border-[#d6aeb9] bg-[#fffaf5] px-5 py-3 text-sm outline-none focus:border-[#ce4f7d]"/><button disabled={saving} className="shrink-0 rounded-full bg-[#542d3c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#754658] disabled:opacity-60">{saving?'Saving…':'Count me in'} <ArrowRight size={14} className="ml-1 inline"/></button></div>
    {error&&<p role="alert" className="mt-2 text-xs text-[#8c3449]">{error}</p>}
  </form>;
}
function Router() { return <RoutedErrorBoundary><Switch><Route path="/" component={Home}/><Route component={NotFound}/></Switch></RoutedErrorBoundary>; }
function RoutedErrorBoundary({children}:{children:ReactNode}) { const [location]=useLocation();return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>; }
export default App;
