import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8 text-center">Términos y Condiciones</h1>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Bienvenido a DramaWave</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <p>
            Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de DramaWave, ubicado en esta aplicación. Al acceder a esta aplicación, asumimos que aceptas estos términos y condiciones. No continúes usando DramaWave si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.
          </p>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">1. Cuentas y Membresía</h2>
            <p>
              Cuando creas una cuenta con nosotros, debes proporcionarnos información precisa, completa y actualizada en todo momento. El no hacerlo constituye una violación de los Términos, lo que puede resultar en la terminación inmediata de tu cuenta en nuestro Servicio.
            </p>
            <p>
              Eres responsable de salvaguardar la contraseña que utilizas para acceder al Servicio y de cualquier actividad o acción bajo tu contraseña.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">2. Contenido del Servicio y Ciclo Anual</h2>
            <p>
              Nuestro servicio, DramaWave, opera en un ciclo de contenido anual. El contenido disponible en la plataforma (películas y series) está disponible por temporadas. Al final de cada año calendario (31 de diciembre), el catálogo de contenido puede ser renovado, y el contenido de la temporada anterior puede dejar de estar disponible.
            </p>
            <p>
              No garantizamos la disponibilidad continua de ningún contenido específico más allá de la temporada actual.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">3. Contenido Generado por el Usuario</h2>
            <p>
              Nuestro Servicio te permite publicar comentarios, stickers y otros materiales ("Contenido de Usuario"). Eres el único responsable del Contenido de Usuario que publicas en o a través del Servicio, incluyendo su legalidad, fiabilidad e idoneidad.
            </p>
            <p>
              Al publicar Contenido de Usuario, nos otorgas el derecho y la licencia para usar, modificar, mostrar públicamente, reproducir y distribuir dicho contenido en y a través del Servicio. Nos reservamos el derecho de eliminar cualquier comentario que consideremos inapropiado, ofensivo o que viole estos Términos.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">4. Propiedad Intelectual</h2>
            <p>
              El Servicio y su contenido original (excluyendo el Contenido de Usuario), características y funcionalidades son y seguirán siendo propiedad exclusiva de DramaWave y sus licenciantes. El Servicio está protegido por derechos de autor, marcas registradas y otras leyes.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">5. Terminación</h2>
            <p>
              Podemos terminar o suspender tu cuenta inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, entre otros, si incumples los Términos.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">6. Limitación de Responsabilidad</h2>
            <p>
              En ningún caso DramaWave, ni sus directores, empleados, socios o agentes, serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, resultantes de tu acceso o uso del Servicio.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">7. Cambios a los Términos</h2>
            <p>
              Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Te notificaremos de cualquier cambio publicando los nuevos términos y condiciones en esta página.
            </p>
            <p className="pt-4">
              <strong>Fecha de última actualización:</strong> {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
