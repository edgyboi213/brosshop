
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User as UserIcon, Search, Menu, LogOut, ChevronDown, Package, MapPin, Truck, Plus, Edit, X, AlertTriangle } from 'lucide-react';
import { Product, User, CartItem, LoginResponse, Category, Order, AdminAuthResponse, Review } from './types';
import { CATEGORIES, PLACEHOLDER_IMAGE, LOGO_URL } from './constants';
import { ProductCard } from './components/ProductCard';
import { AuthModal } from './components/AuthModal';
import { Button } from './components/Button';
import { ProductsApi, ReviewsApi, OrdersApi, UsersApi, AdminAuthApi } from './services/api';

// --- Contexts ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginResponse | AdminAuthResponse, isAdmin?: boolean) => void;
  logout: () => void;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: number) => void;
  removeFromCart: (productId: number, size: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const CartContext = createContext<CartContextType>({} as CartContextType);

// --- Modals ---

// 1. User Profile Modal
interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onLogout }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-lg w-full max-w-sm relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-white uppercase">
            {user.username.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold brand-font text-white">{user.username}</h2>
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Профиль пользователя</span>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
            <label className="block text-xs text-zinc-500 uppercase mb-1">ФИО</label>
            <div className="text-white font-medium">{user.fullName || 'Не указано'}</div>
          </div>
          <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
            <label className="block text-xs text-zinc-500 uppercase mb-1">Логин</label>
            <div className="text-white font-medium">{user.login}</div>
          </div>
          <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
             <label className="block text-xs text-zinc-500 uppercase mb-1">Телефон</label>
             <div className="text-white font-medium">{user.phoneNumber || 'Не указан'}</div>
          </div>
        </div>

        <Button onClick={() => { onLogout(); onClose(); }} variant="danger" className="w-full">
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
};

// 2. Admin Product Modal (Add/Edit)
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (productData: any) => Promise<void>;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Обувь',
    price: 0,
    description: '',
    productImage: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        description: product.description,
        productImage: product.productImage || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Обувь',
        price: 0,
        description: '',
        productImage: ''
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      alert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold mb-6 brand-font">{product ? 'Редактировать товар' : 'Добавить товар'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Название</label>
            <input required className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Категория</label>
              <select className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Цена</label>
              <input type="number" required className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" 
                value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Ссылка на изображение</label>
            <input className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" 
              value={formData.productImage} onChange={e => setFormData({...formData, productImage: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Описание</label>
            <textarea required rows={4} className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white" 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>Сохранить</Button>
        </form>
      </div>
    </div>
  );
};


// --- Pages ---

// 1. Home Page
const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  
  // Use URL params for search
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setError('');
      try {
        const data = await ProductsApi.getAll();
        const productList = Array.isArray(data) ? data : [];
        setProducts(productList);
        setFilteredProducts(productList);
      } catch (e: any) {
        console.error("Failed to fetch products", e);
        setError('Не удалось загрузить товары. Пожалуйста, проверьте подключение к серверу.');
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (selectedCategory) {
        result = result.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortOrder) {
      result.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, sortOrder, products]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-300 brand-font w-full md:w-auto text-center md:text-left mb-2 md:mb-0">
          {searchTerm ? `Результаты: "${searchTerm}"` : 'Каталог товаров'}
        </h2>

        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <select 
            className="bg-zinc-800 text-white px-2 py-2 rounded outline-none cursor-pointer border border-zinc-700 focus:border-orange-500 text-sm w-full truncate"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Все категории</option>
            {CATEGORIES.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select 
            className="bg-zinc-800 text-white px-2 py-2 rounded outline-none cursor-pointer border border-zinc-700 focus:border-orange-500 text-sm w-full truncate"
            value={sortOrder || ''}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="">Сортировка</option>
            <option value="asc">Цена: Возрастание</option>
            <option value="desc">Цена: Убывание</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Grid */}
      {!error && filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-xl">Товары не найдены</p>
          <p className="text-sm mt-2 opacity-50">Попробуйте изменить параметры поиска или категорию</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map(p => (
            <ProductCard key={p.idProduct} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

// 2. Product Details Page
const ProductPage: React.FC = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user, token } = useContext(AuthContext);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]); 
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [newReview, setNewReview] = useState({ title: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  
  const sizes = [38, 39, 40, 41, 42, 43, 44, 45]; 

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const prodData = await ProductsApi.getById(Number(id));
        setProduct(prodData);
        
        // Fetch all reviews and filter client-side since API returns all
        const allReviews = await ReviewsApi.getAll(); 
        if (Array.isArray(allReviews)) {
            // Filter for current product and sort by date descending
            const productReviews = allReviews
                .filter(r => r.idProduct === Number(id))
                .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
            setReviews(productReviews);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (product && selectedSize) {
      addToCart(product, selectedSize);
      alert('Товар добавлен в корзину');
    } else {
      alert('Пожалуйста, выберите размер');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!product) return;

    // Strict check for IDs
    const userId = Number(user.idUser);
    const productId = Number(product.idProduct);

    if (!userId || isNaN(userId)) {
      alert("Ошибка: Не удалось определить ID пользователя. Попробуйте выйти и войти снова.");
      return;
    }

    if (!newReview.title.trim() || !newReview.text.trim()) {
      alert("Пожалуйста, заполните заголовок и текст отзыва");
      return;
    }

    // Explicitly using PascalCase to match C# Controller models (IdReview, IdUser, IdProduct, Title, Text, ReviewDate)
    const payload = {
      IdReview: 0, 
      IdUser: userId,
      IdProduct: productId,
      Title: newReview.title.trim(),
      Text: newReview.text.trim(),
      ReviewDate: new Date().toISOString()
      // Removed IdUserNavigation and IdProductNavigation as requested
    };

    try {
      await ReviewsApi.create(payload as any, token || '');
      
      // Refresh reviews
      const allReviews = await ReviewsApi.getAll();
      const productReviews = allReviews
        .filter(r => r.idProduct === Number(id))
        .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
      
      setReviews(productReviews);
      setNewReview({ title: '', text: '' });
      alert('Отзыв опубликован!');
    } catch (e: any) {
      console.error(e);
      alert(`Ошибка при отправке отзыва: ${e.message}`);
    }
  };

  if (isLoading) return <div className="p-20 text-center text-zinc-500">Загрузка...</div>;
  if (!product) return <div className="p-20 text-center text-red-500">Товар не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-zinc-800 rounded-lg overflow-hidden h-fit">
           <img 
            src={product.productImage || PLACEHOLDER_IMAGE} 
            alt={product.name}
            className="w-full h-auto object-cover"
          />
        </div>
        
        <div className="space-y-6">
          <div className="border-b border-zinc-700 pb-4">
            <h1 className="text-4xl font-bold brand-font mb-2">{product.name}</h1>
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm uppercase font-bold tracking-wide">
              {product.category}
            </span>
            <p className="text-3xl font-bold text-orange-500 mt-4">{product.price.toLocaleString()} ₽</p>
          </div>

          <div>
            <h3 className="text-zinc-400 mb-2 uppercase text-sm font-bold tracking-wider">Описание</h3>
            <p className="text-zinc-300 leading-relaxed">{product.description}</p>
          </div>

          <div>
            <h3 className="text-zinc-400 mb-3 uppercase text-sm font-bold tracking-wider">Размер</h3>
            <div className="flex flex-wrap gap-3">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 rounded flex items-center justify-center font-bold border transition-all ${
                    selectedSize === size 
                    ? 'bg-white text-black border-white' 
                    : 'border-zinc-600 text-zinc-400 hover:border-orange-500 hover:text-orange-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button 
            className="w-full py-4 text-lg uppercase tracking-widest" 
            onClick={handleAddToCart}
          >
            Добавить в корзину
          </Button>
        </div>
      </div>

      <div className="mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold brand-font mb-6 border-b border-zinc-700 pb-2">Отзывы</h2>
        
        {reviews.length === 0 && <p className="text-zinc-500 mb-8">Нет отзывов. Будьте первым!</p>}

        <div className="space-y-6 mb-10">
          {reviews.map((review, idx) => {
            // Determine display name. 
            // Since backend doesn't send username in Review object, we check if it's the current user.
            // Otherwise, we display a generic name.
            const isMe = user && user.idUser === review.idUser;
            const displayName = isMe ? user.username : `Пользователь`;

            return (
              <div key={idx} className="bg-zinc-800/50 p-6 rounded border border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                      <h4 className="font-bold text-lg">{review.title}</h4>
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold ${isMe ? 'text-orange-500' : 'text-zinc-400'}`}>
                           {displayName}
                         </span>
                         {isMe && <span className="text-[10px] bg-zinc-700 px-1 rounded text-zinc-300">Вы</span>}
                      </div>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-zinc-300">{review.text}</p>
              </div>
            );
          })}
        </div>

        {user ? (
          <form onSubmit={submitReview} className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-500" />
                Оставить отзыв
            </h3>
            <div className="mb-4">
              <input 
                placeholder="Заголовок отзыва" 
                required
                className="w-full bg-zinc-700 border border-zinc-600 focus:border-orange-500 rounded p-3 text-white mb-3 outline-none transition-colors"
                value={newReview.title}
                onChange={e => setNewReview({...newReview, title: e.target.value})}
              />
              <textarea 
                placeholder="Ваше мнение о товаре..."
                required
                rows={4}
                className="w-full bg-zinc-700 border border-zinc-600 focus:border-orange-500 rounded p-3 text-white outline-none transition-colors"
                value={newReview.text}
                onChange={e => setNewReview({...newReview, text: e.target.value})}
              />
            </div>
            <Button type="submit">Отправить</Button>
          </form>
        ) : (
          <div className="bg-zinc-800/50 border border-zinc-700 p-8 rounded-lg text-center">
            <UserIcon className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Пожалуйста, войдите в аккаунт, чтобы оставить отзыв.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Cart Page
const CartPage: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);
  const { user, token } = useContext(AuthContext);
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  const totalCost = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Пожалуйста, войдите, чтобы оформить заказ');
      return;
    }
    
    setIsOrdering(true);
    try {
      const finalAddress = deliveryMethod === 'pickup' ? 'Самовывоз: Магазин BrosShop (ул. Ленина 1)' : `Доставка: ${address}`;
      // Updated to match potential backend expectation
      await OrdersApi.create({
        idUser: user.idUser,
        address: finalAddress,
        orderDate: new Date().toISOString()
      }, token || '');
      
      alert('Заказ успешно оформлен!');
      clearCart();
    } catch (err) {
      alert('Ошибка оформления заказа');
      console.error(err);
    } finally {
      setIsOrdering(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl brand-font mb-4">Корзина пуста</h2>
        <Link to="/" className="text-orange-500 hover:underline">Вернуться в каталог</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold brand-font mb-8 border-b border-zinc-800 pb-4">Оформление заказа</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
             <h3 className="text-xl font-bold mb-4 text-zinc-200">Товары в заказе</h3>
             <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={`${item.idProduct}-${item.selectedSize}`} className="flex gap-4 bg-zinc-900/50 p-4 rounded items-center border border-zinc-800">
                  <img src={item.productImage || PLACEHOLDER_IMAGE} className="w-20 h-20 object-cover rounded" alt={item.name} />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-zinc-400 text-sm">Размер: {item.selectedSize}</p>
                    <p className="text-orange-500 font-bold">{item.price} ₽ x {item.quantity}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.idProduct, item.selectedSize)}
                    className="text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ))}
             </div>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-lg h-fit border border-zinc-800 shadow-xl shadow-black/50">
          <h3 className="text-2xl font-bold mb-6 text-orange-500">Итого: {totalCost.toLocaleString()} ₽</h3>
          
          <form onSubmit={handleCheckout} className="space-y-6">
            <div>
              <label className="block mb-3 font-bold text-zinc-300">Способ получения</label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all ${deliveryMethod === 'pickup' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'}`}
                  onClick={() => setDeliveryMethod('pickup')}
                >
                  <MapPin className="w-6 h-6" />
                  <span className="font-bold text-sm">Самовывоз</span>
                </div>
                <div 
                  className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all ${deliveryMethod === 'delivery' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'}`}
                  onClick={() => setDeliveryMethod('delivery')}
                >
                  <Truck className="w-6 h-6" />
                  <span className="font-bold text-sm">Доставка</span>
                </div>
              </div>
            </div>

            <div className="min-h-[150px]">
              {deliveryMethod === 'pickup' ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <p className="text-sm text-zinc-400 mb-2">Наш магазин находится здесь:</p>
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-zinc-700 relative bg-zinc-800">
                     <iframe 
                      title="Store Location"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                      src="https://maps.google.com/maps?q=Moscow,Red+Square&z=14&output=embed"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 text-center">г. Москва, ул. Примерная, д. 1</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block mb-2 text-sm text-zinc-400">Адрес доставки</label>
                  <textarea 
                    required={deliveryMethod === 'delivery'}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded text-white focus:border-orange-500 outline-none resize-none h-32"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Город, Улица, Дом, Квартира..."
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800">
               <Button type="submit" className="w-full py-3 text-lg" isLoading={isOrdering}>
                Подтвердить заказ
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 4. Admin Dashboard
const AdminDashboard: React.FC = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  
  // Product Modal State
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    try {
      if (activeTab === 'products') {
        const data = await ProductsApi.getAll();
        setProducts(Array.isArray(data) ? data : []);
      } else if (activeTab === 'users') {
        const data = await UsersApi.getAll(token || '');
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'orders') {
        const data = await OrdersApi.getAll(token || '');
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { 
    if (user && user.idRole === 3) {
      fetchData(); 
    }
  }, [activeTab, user, token]);

  if (!user || user.idRole !== 3) return <Navigate to="/" />; 

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Удалить товар?')) {
      try {
        await ProductsApi.delete(id, token || '');
        setProducts(prev => prev.filter(p => p.idProduct !== id));
      } catch (e) { alert('Ошибка удаления'); }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };
  
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    const payload = {
      IdProduct: editingProduct ? editingProduct.idProduct : 0,
      Name: data.name,
      Category: data.category,
      Price: data.price,
      Description: data.description,
      ProductImage: data.productImage
    };
    try {
      if (editingProduct) {
        // Update
        await ProductsApi.update(editingProduct.idProduct, payload as any, token || '');
      } else {
        // Create
        await ProductsApi.create(payload as any, token || '');
      }
      fetchData(); // Refresh list
    } catch (e) {
      throw e;
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (window.confirm('Удалить заказ?')) {
      try {
        await OrdersApi.delete(id, token || '');
        setOrders(prev => prev.filter(o => o.idOrder !== id));
      } catch (e) { alert('Ошибка удаления'); }
    }
  };

  const filteredUsers = users.filter(u => 
    (u.phoneNumber && u.phoneNumber.includes(phoneSearch)) || u.login.includes(phoneSearch)
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <ProductModal 
        isOpen={isProductModalOpen} 
        onClose={() => setProductModalOpen(false)} 
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl brand-font text-orange-500">ADMIN DASHBOARD</h1>
        <Link to="/" className="text-sm underline">Вернуться на сайт</Link>
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-orange-500' : 'bg-zinc-800'}`}>Товары</button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-orange-500' : 'bg-zinc-800'}`}>Пользователи</button>
        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded ${activeTab === 'orders' ? 'bg-orange-500' : 'bg-zinc-800'}`}>Заказы</button>
      </div>

      <div className="bg-zinc-800 p-6 rounded-lg overflow-x-auto min-h-[500px]">
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreateProduct} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Добавить товар
              </Button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="p-2">ID</th>
                  <th className="p-2">Image</th>
                  <th className="p-2">Название</th>
                  <th className="p-2">Категория</th>
                  <th className="p-2">Цена</th>
                  <th className="p-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.idProduct} className="border-b border-zinc-700/50 hover:bg-zinc-700/20">
                    <td className="p-2">{p.idProduct}</td>
                    <td className="p-2">
                      <img src={p.productImage || PLACEHOLDER_IMAGE} alt="" className="w-10 h-10 object-cover rounded" />
                    </td>
                    <td className="p-2 font-bold">{p.name}</td>
                    <td className="p-2 text-sm text-zinc-400">{p.category}</td>
                    <td className="p-2 text-orange-500">{p.price}</td>
                    <td className="p-2 text-right space-x-2">
                      <button onClick={() => handleEditProduct(p)} className="text-blue-500 hover:underline">
                        Изменить
                      </button>
                      <button onClick={() => handleDeleteProduct(p.idProduct)} className="text-red-500 hover:underline">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="mb-4">
              <input 
                placeholder="Поиск по телефону или логину..." 
                className="bg-zinc-700 p-2 rounded text-white border border-zinc-600 w-full md:w-1/3"
                value={phoneSearch}
                onChange={e => setPhoneSearch(e.target.value)}
              />
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-700 text-zinc-400">
                  <th className="p-2">Login</th>
                  <th className="p-2">ФИО</th>
                  <th className="p-2">Телефон</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.idUser} className="border-b border-zinc-700/50 hover:bg-zinc-700/20">
                    <td className="p-2 font-bold">{u.login}</td>
                    <td className="p-2">{u.fullName}</td>
                    <td className="p-2 text-zinc-400">{u.phoneNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'orders' && (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-700 text-zinc-400">
                <th className="p-2">ID</th>
                <th className="p-2">Адрес / Детали</th>
                <th className="p-2">Дата</th>
                <th className="p-2">Статус</th>
                <th className="p-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.idOrder} className="border-b border-zinc-700/50 hover:bg-zinc-700/20">
                  <td className="p-2">{o.idOrder}</td>
                  <td className="p-2 max-w-xs truncate" title={o.address}>{o.address}</td>
                  <td className="p-2">{new Date(o.orderDate).toLocaleDateString()}</td>
                  <td className="p-2"><span className="bg-zinc-700 px-2 py-1 rounded text-xs text-white">{o.status || 'Active'}</span></td>
                  <td className="p-2 text-right">
                    <button onClick={() => handleDeleteOrder(o.idOrder)} className="text-red-500 hover:underline">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// 5. Admin Login (Separate Entry)
const AdminLogin: React.FC = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ username: '', password: '' });

  useEffect(() => {
    // If already logged in as admin, redirect to dashboard
    if (user && user.idRole === 3) {
        navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await AdminAuthApi.login(creds);
      login(res, true);
      navigate('/admin/dashboard');
    } catch (e) {
      alert('Ошибка входа: Неверные данные');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded border border-zinc-800 w-96 shadow-2xl">
        <h1 className="text-2xl brand-font text-orange-500 mb-6 text-center">ADMIN ACCESS</h1>
        <input 
          className="w-full mb-4 p-3 bg-zinc-800 rounded border border-zinc-700 text-white focus:border-orange-500 outline-none" 
          placeholder="Username" 
          value={creds.username} 
          onChange={e => setCreds({...creds, username: e.target.value})}
        />
        <input 
          className="w-full mb-6 p-3 bg-zinc-800 rounded border border-zinc-700 text-white focus:border-orange-500 outline-none" 
          type="password"
          placeholder="Password" 
          value={creds.password} 
          onChange={e => setCreds({...creds, password: e.target.value})}
        />
        <Button className="w-full">Вход</Button>
      </form>
    </div>
  );
};

// --- Main Layout ---
const Layout: React.FC = () => {
  const { user, logout, login } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  
  // Profile Modal
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  
  // Search logic in Header
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    navigate(`/?q=${val}`);
  };

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setAuthOpen(false)} 
        onLoginSuccess={(data) => {
          login(data, false);
          setAuthOpen(false);
        }} 
      />
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
        user={user} 
        onLogout={logout} 
      />
      
      <header className="sticky top-0 z-40 bg-black/95 border-b border-zinc-800 backdrop-blur">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO_URL} alt="BROS SHOP" className="h-10" /> 
            <span className="sr-only">BrosShop</span>
          </Link>

          {/* Search Bar - Center aligned */}
          <div className="hidden md:block flex-1 max-w-xl relative">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Найти товар..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  value={searchTerm}
                  onChange={handleSearch}
                />
             </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <div className="relative group">
              <button className="flex items-center gap-1 font-bold hover:text-orange-500 py-4 uppercase text-sm tracking-wide">
                Каталог <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full right-0 w-48 bg-zinc-900 border border-zinc-700 rounded-b shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                {CATEGORIES.map(cat => (
                  <div key={cat.name} className="border-b border-zinc-800 last:border-0">
                     <div className="px-4 py-2 font-bold text-orange-500 text-sm">{cat.name}</div>
                     {cat.sub.map(sub => (
                       <div key={sub} className="px-6 py-1 text-sm text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-800">
                         {sub} {cat.name}
                       </div>
                     ))}
                     {cat.sub.length === 0 && (
                       <div className="px-6 py-1 text-sm text-zinc-400 hover:text-white cursor-pointer hover:bg-zinc-800">
                         Все {cat.name}
                       </div>
                     )}
                  </div>
                ))}
              </div>
            </div>
            
            <Link to="/cart" className="relative hover:text-orange-500 group">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold group-hover:scale-110 transition-transform">
                  {totalItems}
                </span>
              )}
            </Link>

            {user && user.idRole !== 3 ? (
               <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setProfileModalOpen(true)}>
                 <div className="text-right hidden lg:block">
                    <div className="text-xs text-zinc-500">Привет,</div>
                    <div className="text-sm font-bold text-orange-500 leading-none group-hover:text-white transition-colors">{user.username}</div>
                 </div>
                 <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 group-hover:border-orange-500 transition-colors">
                     <UserIcon className="w-5 h-5 text-zinc-400 group-hover:text-orange-500" />
                 </div>
               </div>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="hover:text-orange-500">
                <UserIcon className="w-6 h-6" />
              </button>
            )}
          </nav>

          <button className="md:hidden" onClick={() => setMenuOpen(!isMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Search - Visible only on mobile */}
        <div className="md:hidden px-4 pb-4">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Найти товар..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-orange-500"
                  value={searchTerm}
                  onChange={handleSearch}
                />
             </div>
        </div>
      </header>
      
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-4 space-y-4 animate-in slide-in-from-top-2">
          <Link to="/cart" className="flex items-center gap-2 font-bold" onClick={() => setMenuOpen(false)}>
            <ShoppingCart className="w-5 h-5 text-orange-500" /> Корзина ({totalItems})
          </Link>
          <div className="border-t border-zinc-800 pt-2">
            <p className="text-xs text-zinc-500 uppercase mb-2">Категории</p>
            {CATEGORIES.map(c => (
              <div key={c.name} className="py-1 text-sm">{c.name}</div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-4">
          {user && user.idRole !== 3 ? (
             <>
               <button onClick={() => { setProfileModalOpen(true); setMenuOpen(false); }} className="flex items-center gap-2 text-white w-full text-left mb-3">
                 <UserIcon className="w-5 h-5 text-orange-500" /> Профиль ({user.username})
               </button>
               <button onClick={logout} className="flex items-center gap-2 text-red-500 w-full text-left">
                 <LogOut className="w-5 h-5" /> Выйти
               </button>
             </>
          ) : (
            <button onClick={() => { setAuthOpen(true); setMenuOpen(false); }} className="flex items-center gap-2 w-full text-left font-bold text-orange-500">
              <UserIcon className="w-5 h-5" /> Войти / Регистрация
            </button>
          )}
          </div>
        </div>
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 text-center text-zinc-500">
        <p className="brand-font text-2xl text-white mb-4">BROS SHOP</p>
        <p>© 2023 Bros Shop. All rights reserved.</p>
      </footer>
    </div>
  );
};

// --- App Root ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Restore session
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch(e) { /* ignore */ }
        }
    }
  }, []);

  // Auth Logic
  const login = (data: LoginResponse | AdminAuthResponse, isAdmin: boolean = false) => {
    setToken(data.token);
    localStorage.setItem('token', data.token);
    
    if (isAdmin) {
       const adminData = data as AdminAuthResponse;
       const u: User = {
         idUser: adminData.idAdministrator,
         login: adminData.username,
         username: adminData.username,
         fullName: 'Administrator',
         idRole: 3
       };
       setUser(u);
       localStorage.setItem('user', JSON.stringify(u));
    } else {
       const userData = data as LoginResponse;
       // Initial basic user state
       const basicUser: User = { 
         idUser: userData.idUser, 
         login: userData.login, 
         username: userData.login, 
         fullName: '', 
         idRole: 4,
         phoneNumber: '' 
       };
       setUser(basicUser);
       localStorage.setItem('user', JSON.stringify(basicUser));
       
       // Fetch full details
       UsersApi.getById(userData.idUser, data.token).then(fullUser => {
         if (fullUser) {
           setUser(fullUser);
           localStorage.setItem('user', JSON.stringify(fullUser));
         }
       }).catch(e => console.error("Failed to load user profile", e));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Cart Logic
  const addToCart = (product: Product, size: number) => {
    setCart(prev => {
      const existing = prev.find(p => p.idProduct === product.idProduct && p.selectedSize === size);
      if (existing) {
        return prev.map(p => p === existing ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (id: number, size: number) => {
    setCart(prev => prev.filter(p => !(p.idProduct === id && p.selectedSize === size)));
  };

  const clearCart = () => setCart([]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems: cart.reduce((a, c) => a + c.quantity, 0) }}>
        <HashRouter>
          <Routes>
            <Route path="/admin/*" element={<Routes>
                <Route path="/" element={<AdminLogin />} />
                <Route path="/dashboard" element={<AdminDashboard />} />
            </Routes>} />
            
            <Route path="/*" element={<Layout />} />
          </Routes>
        </HashRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
