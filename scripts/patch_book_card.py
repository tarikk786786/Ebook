import re

with open('components/BookCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isLoaded state and reset
target_state = """  const [imgSrc, setImgSrc] = useState<string>(book.coverImage || `/api/covers/${book.slug}`);
  const [imgError, setImgError] = useState(false);
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);

  useEffect(() => {
    setImgSrc(book.coverImage || `/api/covers/${book.slug}`);
    setImgError(false);
  }, [book.id, book.slug, book.coverImage]);"""

replacement_state = """  const [imgSrc, setImgSrc] = useState<string>(book.coverImage || `/api/covers/${book.slug}`);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToCart, items } = useCart();
  const isInCart = items.some((i) => i.bookId === book.id);

  useEffect(() => {
    setImgSrc(book.coverImage || `/api/covers/${book.slug}`);
    setImgError(false);
    setIsLoaded(false);
  }, [book.id, book.slug, book.coverImage]);"""

# 2. Resilient cover container inside Link
pattern_cover = re.compile(r'\{!imgError \? \(.*?\) : \(.*?\)\}', re.DOTALL)

replacement_cover = """{/* High-contrast authentic publisher hardcover background (NEVER blank) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E2330] via-[#141824] to-[#0A0D14] text-white flex flex-col justify-between p-3 select-none">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-sans font-medium uppercase tracking-wider text-emerald-400">
                  {book.format || 'PDF'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{book.pages || 280}p</span>
            </div>
            <div className="my-auto py-2">
              <h4 className="font-serif text-[11px] font-bold text-white line-clamp-3 leading-snug">
                {book.title}
              </h4>
              <p className="text-[10px] text-amber-300/90 mt-1 line-clamp-1 italic font-serif">
                {book.author}
              </p>
            </div>
            <div className="text-[9px] text-slate-400 font-mono tracking-wider uppercase border-t border-slate-700/60 pt-1.5 flex justify-between">
              <span>AnonTrove</span>
              <span className="text-emerald-400">DRM-Free</span>
            </div>
          </div>

          {/* Real cover image layer smoothly fades in when loaded */}
          {!imgError && (
            <img
              src={imgSrc}
              alt={book.title}
              onLoad={() => setIsLoaded(true)}
              onError={handleImageError}
              loading="lazy"
              className={cn(
                "relative z-1 w-full h-full object-cover object-center group-hover:scale-[1.03] transition-all duration-300 ease-out",
                isLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          )}"""

content = content.replace(target_state, replacement_state)
content = pattern_cover.sub(replacement_cover, content, count=1)

with open('components/BookCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("BookCard.tsx successfully patched!")
