
import Link from 'next/link'
import { Shield, Bot, FileText, Users, BarChart3, Lock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">CSrental AI</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login" className="btn-secondary">
                Inloggen
              </Link>
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Welkom bij <span className="text-primary-600">CSrental AI</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Uw persoonlijke AI assistenten voor technische kennis en inkoop. 
            Veilig, intelligent en altijd beschikbaar.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/dashboard" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                Start Chatten
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* CeeS - Technical Bot */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <Bot className="h-8 w-8 text-blue-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">CeeS</h3>
              </div>
              <p className="mt-2 text-base text-gray-500">
                Technische kennis chatbot voor monteurs en technici. 
                Krijg direct antwoord op technische vragen en procedures.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>• Installatiehandleidingen</li>
                <li>• Troubleshooting hulp</li>
                <li>• Veiligheidsinstructies</li>
                <li>• Technische specificaties</li>
              </ul>
            </div>

            {/* ChriS - Procurement Bot */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">ChriS</h3>
              </div>
              <p className="mt-2 text-base text-gray-500">
                Inkoop AI chatbot voor efficiënte inkoopbeslissingen. 
                Vergelijk prijzen en optimaliseer uw inkoopproces.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>• Prijsvergelijkingen</li>
                <li>• Leveranciersinformatie</li>
                <li>• Kostenanalyses</li>
                <li>• Inkoopadvies</li>
              </ul>
            </div>

            {/* Security Features */}
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Beveiliging</h3>
              </div>
              <p className="mt-2 text-base text-gray-500">
                Enterprise-grade beveiliging met 2FA, IP whitelisting 
                en uitgebreide audit logging.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>• Two-Factor Authentication</li>
                <li>• IP Toegangscontrole</li>
                <li>• Audit Logging</li>
                <li>• Rate Limiting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Features */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Admin Functionaliteiten
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Document Beheer
              </h4>
              <p className="text-gray-600">
                Goedkeuren en afwijzen van geüploade documenten 
                met automatische RAG integratie.
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Gebruikersbeheer
              </h4>
              <p className="text-gray-600">
                Beheer gebruikersrollen, 2FA instellingen 
                en toegangsrechten.
              </p>
            </div>
            <div className="text-center">
              <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Security Monitoring
              </h4>
              <p className="text-gray-600">
                Real-time monitoring van security events 
                en audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <Shield className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Beveiligingsmelding
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Dit is een interne tool voor CSrental medewerkers. 
                Toegang is beperkt tot geautoriseerde IP-adressen en vereist 2FA voor admin functies.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 CSrental. Alle rechten voorbehouden.</p>
            <p className="mt-1 text-sm">
              Versie 2.0 - Verbeterde beveiliging en functionaliteit
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
