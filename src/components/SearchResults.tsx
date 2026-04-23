import React from 'react';
import { Product, PackageData } from '../types';
import { ProductCard } from './ProductCard';
import { PackageCard } from './PackageCard';
import { ComboCard } from './ComboCard';
import { X, Search, ShoppingBag, Package, LayoutGrid } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  products: Product[];
  recommendedPackages: PackageData[];
  comboPackages: PackageData[];
  onClose: () => void;
  onViewProduct: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
  onOrderPackage: (pkg: PackageData) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  products,
  recommendedPackages,
  comboPackages,
  onClose,
  onViewProduct,
  onOrderProduct,
  onOrderPackage
}) => {
  const lowerQuery = query.toLowerCase();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.short_desc.toLowerCase().includes(lowerQuery) ||
    p.long_desc?.toLowerCase().includes(lowerQuery) ||
    p.health_benefits.some(b => b.toLowerCase().includes(lowerQuery)) ||
    p.product_code.toLowerCase().includes(lowerQuery)
  );

  const filteredRecommended = recommendedPackages.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.health_benefits.some(b => b.toLowerCase().includes(lowerQuery)) ||
    p.symptoms.some(s => s.toLowerCase().includes(lowerQuery)) ||
    p.package_code?.toLowerCase().includes(lowerQuery)
  );

  const filteredCombo = comboPackages.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.health_benefits.some(b => b.toLowerCase().includes(lowerQuery)) ||
    p.symptoms.some(s => s.toLowerCase().includes(lowerQuery)) ||
    p.package_code?.toLowerCase().includes(lowerQuery)
  );

  const totalResults = filteredProducts.length + filteredRecommended.length + filteredCombo.length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-12">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 md:gap-4">
            <Search className="text-emerald-600 w-8 h-8 md:w-12 md:h-12" />
            Search Results
          </h2>
          <p className="text-slate-500 font-bold mt-1 md:text-xl">
            Found {totalResults} matches for <span className="text-emerald-600">"{query}"</span>
          </p>
        </div>
        <button 
          onClick={onClose}
          className="self-start md:self-center px-6 py-3 bg-slate-100 text-slate-600 rounded-full font-black hover:bg-slate-200 transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
        >
          <X size={20} /> Close Search
        </button>
      </div>

      {totalResults === 0 ? (
        <div className="text-center py-20 md:py-32 bg-slate-50 rounded-[2rem] md:rounded-[4rem] border-4 border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-400">
            <Search size={48} />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">No matches found</h3>
          <p className="text-slate-500 font-bold mt-4 max-w-lg mx-auto md:text-lg">
            Try searching for symptoms like "back pain", diseases like "diabetes", or specific product names.
          </p>
          <button 
            onClick={onClose}
            className="mt-10 bg-emerald-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="space-y-16 md:space-y-24">
          {filteredProducts.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  Products <span className="text-emerald-500 ml-2">({filteredProducts.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onQuickView={onViewProduct}
                    onOrder={() => onOrderProduct(product)}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredRecommended.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <LayoutGrid size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  Health Packages <span className="text-blue-500 ml-2">({filteredRecommended.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredRecommended.map(pkg => (
                  <PackageCard 
                    key={pkg.id}
                    data={pkg}
                    allPackages={recommendedPackages}
                    onOrder={() => onOrderPackage(pkg)}
                    onViewProduct={onViewProduct}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredCombo.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  Value Bundles <span className="text-purple-500 ml-2">({filteredCombo.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                {filteredCombo.map(pkg => (
                  <ComboCard 
                    key={pkg.id}
                    data={pkg}
                    onOrder={onOrderPackage}
                    onProductClick={onViewProduct}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
