import React from 'react';
import { Gamepad2, Github, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
                <Gamepad2 className="text-black w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-white">SYRIA GAMING <span className="text-cyan-400">HUB</span></span>
            </div>
            <p className="text-gray-400 max-w-xs">
              وجهتك النهائية للمنتجات الرقمية، مفاتيح الألعاب، واشتراكات الألعاب. سريع، آمن، وموثوق.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">روابط سريعة</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/" className="hover:text-cyan-400 transition-colors">الرئيسية</a></li>
              <li><a href="/games" className="hover:text-cyan-400 transition-colors">الألعاب</a></li>
              <li><a href="/store" className="hover:text-cyan-400 transition-colors">المتجر</a></li>
              <li><a href="/orders" className="hover:text-cyan-400 transition-colors">طلباتي</a></li>
              <li><a href="/contact" className="hover:text-cyan-400 transition-colors">تواصل معنا</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">تابعنا</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} SYRIA GAMING HUB. All rights reserved. Built for gamers.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
