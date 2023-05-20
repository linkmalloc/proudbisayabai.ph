# Use a base image with Ruby and necessary dependencies
FROM ruby:2.7-alpine

# Install system dependencies
RUN apk add --update --no-cache \
    build-base \
    curl \
    git \
    nodejs \
    npm

# Set the working directory in the container
WORKDIR /app

# Copy the Gemfile and Gemfile.lock to the working directory
COPY Gemfile Gemfile.lock ./

# Install Jekyll and its dependencies
RUN bundle install

# Copy the Jekyll source code to the working directory
COPY . .

# Expose the default Jekyll port (optional)
EXPOSE 4000

# Set the default command to build and serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
