# Front matter fixes for jekyll-seo-tag:
# - It only reads `image` for og:image, twitter:image and the JSON-LD image. Posts and pages
#   store theirs as img_big_3000x1144 / img_big_1000x600, so copy the first one found into
#   `image` (falling back to the site placeholder) when `image` isn't set.
# - It treats `description: ""` as present and skips the excerpt, so drop blank descriptions
#   to let posts fall back to their excerpt.
# jekyll-seo-tag falls back to the author's display name for twitter:creator, which turns
# "Ariel Alegado" into the invalid handle "@Ariel Alegado". Only use an explicit `twitter`
# value (from _data/authors.yml or an author hash).
Jekyll::SeoTag::AuthorDrop.class_eval do
  def twitter
    return @twitter if defined? @twitter

    handle = author_hash["twitter"]
    @twitter = handle.is_a?(String) ? handle.sub(%r!^@!, "") : nil
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  placeholder = site.data.dig("defaults", "pageholder", "img_big_3000x1144")

  (site.posts.docs + site.pages).each do |doc|
    doc.data.delete("description") if doc.data.key?("description") && doc.data["description"].to_s.strip.empty?

    next if doc.data["image"]

    image = doc.data["img_big_3000x1144"] || doc.data["img_big_1000x600"] || placeholder
    doc.data["image"] = image if image
  end
end
