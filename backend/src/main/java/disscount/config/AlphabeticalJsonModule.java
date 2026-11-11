package disscount.config;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import disscount.shared.AlphabeticalJson;
import tools.jackson.databind.BeanDescription;
import tools.jackson.databind.SerializationConfig;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.ser.BeanPropertyWriter;
import tools.jackson.databind.ser.ValueSerializerModifier;

/** Spring Boot registers every JacksonModule bean on the app's JsonMapper. */
@Component
class AlphabeticalJsonModule extends SimpleModule {

    AlphabeticalJsonModule() {
        super("alphabetical-json");
        setSerializerModifier(new AlphabeticalOrder());
    }

    private static final class AlphabeticalOrder extends ValueSerializerModifier {

        @Override
        public List<BeanPropertyWriter> orderProperties(
                SerializationConfig config, BeanDescription.Supplier bean, List<BeanPropertyWriter> properties) {
            if (!bean.getBeanClass().isAnnotationPresent(AlphabeticalJson.class)) {
                return properties;
            }

            return properties.stream()
                    .sorted(Comparator.comparing(BeanPropertyWriter::getName))
                    .toList();
        }
    }
}
