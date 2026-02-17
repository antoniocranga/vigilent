// app/contracts/[id]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Contract negăsit</h1>
            <p className="text-muted-foreground">
              Contractul pe care îl cauți nu există sau a fost șters.
            </p>
          </div>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la listă
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}