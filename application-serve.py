from livereload import Server, shell

# Create server
server = Server()

# Watch files
server.watch('*.html')
server.watch('*.css')
server.watch('*.js')
server.watch('*.json')

# Serve files from current directory on port 8000
server.serve(port=8000, host='0.0.0.0', root='.')
