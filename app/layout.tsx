import "./globals.css";
import {Providers} from "@/components/providers";
import {Header} from "@/components/header";
import {Footer} from "@/components/footer";
import {RateStrip} from "@/components/rate-strip";
import {Splash} from "@/components/splash";
import {Toaster} from "sonner";
export const metadata={title:"GoldMate",description:"GoldMate — premium gold & jewelry platform"};
export default function Layout({children}:{children:React.ReactNode}){return <html><body><Providers><Splash/><Header/><RateStrip/>{children}<Footer/><Toaster richColors position="bottom-right"/></Providers></body></html>}
