interface IJsonLdScriptProps {
  data: object;
}

export default function JsonLdScript({ data }: IJsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Upstream text such as product names could hold "</script>", so "<" is escaped to keep it inside.
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
