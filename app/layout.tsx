import type { Metadata } from 'next';
import './styles.css';

export const metadata:Metadata={title:'Virtual Engineering Workshop',description:'Engineering learning and practical sessions'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
